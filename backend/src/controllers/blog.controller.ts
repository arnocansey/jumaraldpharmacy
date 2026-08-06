import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().optional(),
  author: z.string().min(1),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().optional(),
  author: z.string().min(1).optional(),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1),
});

export async function getBlogPosts(req: any, res: Response) {
  try {
    const { tag, search, page = "1", limit = "10" } = req.query;

    const where: any = {};
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];
    }

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          _count: { select: { comments: true } },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return res.json({
      posts,
      pagination: { total, page: Number(page), pages: Math.ceil(total / take) },
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch blog posts" });
  }
}

export async function getBlogPostBySlug(req: any, res: Response) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
      include: {
        comments: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!post) return res.status(404).json({ message: "Blog post not found" });
    return res.json(post);
  } catch {
    return res.status(500).json({ message: "Failed to fetch blog post" });
  }
}

export async function createBlogPost(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createPostSchema.parse(req.body);
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        summary: data.summary ?? null,
        author: data.author,
        imageUrl: data.imageUrl ?? null,
        tags: data.tags,
      },
    });
    return res.status(201).json(post);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create blog post" });
  }
}

export async function updateBlogPost(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Blog post not found" });

    const data = updatePostSchema.parse(req.body);
    const updated = await prisma.blogPost.update({
      where: { id },
      data,
    });
    return res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update blog post" });
  }
}

export async function deleteBlogPost(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Blog post not found" });
    await prisma.blogPost.delete({ where: { id } });
    return res.json({ message: "Blog post deleted successfully" });
  } catch {
    return res.status(500).json({ message: "Failed to delete blog post" });
  }
}

export async function addComment(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ message: "Blog post not found" });

    const data = commentSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: {
        blogPostId: id,
        userId: req.user!.id,
        content: data.content,
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
    return res.status(201).json(comment);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to add comment" });
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response) {
  try {
    const { commentId } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userId !== req.user!.id && req.user!.role !== "SUPER_ADMIN" && req.user!.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }
    await prisma.comment.delete({ where: { id: commentId } });
    return res.json({ message: "Comment deleted successfully" });
  } catch {
    return res.status(500).json({ message: "Failed to delete comment" });
  }
}
