import { Request, Response, NextFunction } from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Note, INote } from '../models/note.model';
import { logger } from '../utils/logger';

export interface ICreateNoteBody {
  title: string;
  content: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface IUpdateNoteBody {
  title?: string;
  content?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface IGetNotesQuery {
  search?: string;
  isPinned?: string;
}

const escapeRegex = (text: string): string => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

export class NoteController {
  static async createNote(
    req: AuthRequest & Request<{}, any, ICreateNoteBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { title, content, tags, isPinned } = req.body;

      if (!title || !content) {
        res.status(400);
        throw new Error('Title and content are required');
      }

      if (!req.user) {
        res.status(401);
        throw new Error('Unauthorized');
      }

      const note = await Note.create({
        title,
        content,
        tags: tags || [],
        isPinned: isPinned || false,
        userId: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        note,
      });
      logger.info({ noteId: note._id, userId: req.user._id }, 'Note created successfully');
    } catch (error) {
      logger.error({ err: error, userId: req.user?._id }, 'Error occurred during note creation');
      next(error);
    }
  }

  static async getNotes(
    req: AuthRequest & Request<{}, any, any, IGetNotesQuery>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401);
        throw new Error('Unauthorized');
      }

      const { search, isPinned } = req.query;
      const query: FilterQuery<INote> = { userId: req.user._id as mongoose.Types.ObjectId };

      if (typeof search === 'string' && search.trim().length > 0) {
        const escapedSearch = escapeRegex(search.trim().substring(0, 100));
        query.$or = [
          { title: { $regex: escapedSearch, $options: 'i' } },
          { content: { $regex: escapedSearch, $options: 'i' } },
        ];
      }

      if (isPinned !== undefined) {
        query.isPinned = isPinned === 'true';
      }

      const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 });

      logger.info({ userId: req.user._id, count: notes.length, search, isPinned }, 'Fetched user notes successfully');

      res.status(200).json({
        success: true,
        count: notes.length,
        notes,
      });
    } catch (error) {
      logger.error({ err: error, userId: req.user?._id }, 'Error occurred while fetching notes');
      next(error);
    }
  }

  static async getNoteById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401);
        throw new Error('Unauthorized');
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid note ID format');
      }

      const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

      if (!note) {
        logger.warn({ noteId: req.params.id, userId: req.user._id }, 'Fetch note by ID failed: Note not found');
        res.status(404);
        throw new Error('Note not found');
      }

      logger.info({ noteId: note._id, userId: req.user._id }, 'Fetched note details successfully');

      res.status(200).json({
        success: true,
        note,
      });
    } catch (error) {
      logger.error({ err: error, noteId: req.params.id, userId: req.user?._id }, 'Error occurred while fetching note details');
      next(error);
    }
  }

  static async updateNote(
    req: AuthRequest & Request<{ id: string }, any, IUpdateNoteBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401);
        throw new Error('Unauthorized');
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid note ID format');
      }

      const { title, content, tags, isPinned } = req.body;

      const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

      if (!note) {
        res.status(404);
        throw new Error('Note not found');
      }

      if (title !== undefined) {
        note.title = title;
      }

      if (content !== undefined) {
        note.content = content;
      }

      if (tags !== undefined) {
        note.tags = tags;
      }
      if (isPinned !== undefined) {
        note.isPinned = isPinned;
      }

      await note.save();

      logger.info({ noteId: note._id, userId: req.user._id }, 'Note updated successfully');

      res.status(200).json({
        success: true,
        message: 'Note updated successfully',
        note,
      });
    } catch (error) {
      logger.error({ err: error, noteId: req.params.id, userId: req.user?._id }, 'Error occurred during note update');
      next(error);
    }
  }

  static async deleteNote(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401);
        throw new Error('Unauthorized');
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid note ID format');
      }

      const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

      if (!note) {
        logger.warn({ noteId: req.params.id, userId: req.user._id }, 'Delete note failed: Note not found');
        res.status(404);
        throw new Error('Note not found');
      }

      await note.deleteOne();

      logger.info({ noteId: req.params.id, userId: req.user._id }, 'Note deleted successfully');

      res.status(200).json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (error) {
      logger.error({ err: error, noteId: req.params.id, userId: req.user?._id }, 'Error occurred during note deletion');
      next(error);
    }
  }

  static async exportNotes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401);
        throw new Error('Unauthorized');
      }

      const notes = await Note.find({ userId: req.user._id }).sort({ isPinned: -1, updatedAt: -1 });

      logger.info({ userId: req.user._id, count: notes.length }, 'Exported notes successfully');

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=notes-export.json');
      res.status(200).json({
        success: true,
        notes,
      });
    } catch (error) {
      logger.error({ err: error, userId: req.user?._id }, 'Error occurred during notes export');
      next(error);
    }
  }

  static async importNotes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401);
        throw new Error('Unauthorized');
      }

      const { notes } = req.body;

      if (!Array.isArray(notes)) {
        res.status(400);
        throw new Error('Invalid notes format, expected an array');
      }

      const importedNotes = [];
      for (const item of notes) {
        if (!item || typeof item !== 'object') {
          continue;
        }

        if (!item.title || !item.content) {
          continue;
        }

        importedNotes.push({
          title: String(item.title),
          content: String(item.content),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          isPinned: !!item.isPinned,
          userId: req.user._id,
        });
      }

      if (importedNotes.length === 0) {
        res.status(400);
        throw new Error('No valid notes found to import');
      }

      const result = await Note.insertMany(importedNotes);

      logger.info({ userId: req.user._id, count: result.length }, 'Imported notes successfully');

      res.status(201).json({
        success: true,
        message: `${result.length} notes imported successfully`,
        notes: result,
      });
    } catch (error) {
      logger.error({ err: error, userId: req.user?._id }, 'Error occurred during notes import');
      next(error);
    }
  }
}
