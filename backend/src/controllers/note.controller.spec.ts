import { expect } from 'chai';
import request from 'supertest';
import mongoose, { FilterQuery } from 'mongoose';
import app from '../app';
import { Note, INote } from '../models/note.model';
import { User } from '../models/user.model';
import jwt from 'jsonwebtoken';

describe('Note API Endpoints', () => {
  const token = 'Bearer mock-valid-token';
  const mockUser = {
    _id: '60c72b2f9b1d8b2bad000001',
    email: 'test@example.com',
    name: 'Test User',
    tokenVersion: 0,
  };

  let originalCreate: typeof Note.create;
  let originalFind: typeof Note.find;
  let originalFindOne: typeof Note.findOne;
  let originalFindById: typeof User.findById;
  let originalVerify: typeof jwt.verify;
  let originalInsertMany: typeof Note.insertMany;

  before(() => {
    originalCreate = Note.create;
    originalFind = Note.find;
    originalFindOne = Note.findOne;
    originalFindById = User.findById;
    originalVerify = jwt.verify;
    originalInsertMany = Note.insertMany;
  });

  afterEach(() => {
    Note.create = originalCreate;
    Note.find = originalFind;
    Note.findOne = originalFindOne;
    User.findById = originalFindById;
    jwt.verify = originalVerify;
    Note.insertMany = originalInsertMany;
  });

  const stubAuthSuccess = () => {
    jwt.verify = (() => ({ id: '60c72b2f9b1d8b2bad000001', tokenVersion: 0 })) as unknown as typeof jwt.verify;
    User.findById = (() => ({
      select: () => Promise.resolve(mockUser),
    })) as unknown as typeof User.findById;
  };

  describe('POST /api/notes', () => {
    it('should create a new note successfully with valid input', async () => {
      stubAuthSuccess();

      const noteData = {
        title: 'Work Tasks',
        content: 'Finish coding assignment',
        tags: ['coding', 'work'],
        isPinned: false,
      };

      Note.create = (async (data: any) => {
        return {
          ...data,
          _id: '60c72b2f9b1d8b2bad000123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }) as unknown as typeof Note.create;

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', token)
        .send(noteData);

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Note created successfully');
      expect(response.body.note.title).to.equal('Work Tasks');
      expect(response.body.note.userId).to.equal('60c72b2f9b1d8b2bad000001');
    });

    it('should return 400 if title or content is missing', async () => {
      stubAuthSuccess();

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', token)
        .send({ title: 'Untitled Note' });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Title and content are required');
    });
  });

  describe('GET /api/notes', () => {
    it('should return list of user notes sorted by status', async () => {
      stubAuthSuccess();

      const mockNotes = [
        { _id: '60c72b2f9b1d8b2bad000111', title: 'Note A', content: 'Content A', isPinned: true, userId: '60c72b2f9b1d8b2bad000001' },
        { _id: '60c72b2f9b1d8b2bad000222', title: 'Note B', content: 'Content B', isPinned: false, userId: '60c72b2f9b1d8b2bad000001' },
      ];

      Note.find = (() => ({
        sort: () => Promise.resolve(mockNotes),
      })) as unknown as typeof Note.find;

      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', token);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.count).to.equal(2);
      expect(response.body.notes).to.have.lengthOf(2);
    });

    it('should query notes with search keyword if provided', async () => {
      stubAuthSuccess();

      let capturedQuery: FilterQuery<INote> | null = null;
      Note.find = ((query: FilterQuery<INote>) => {
        capturedQuery = query;
        return {
          sort: () => Promise.resolve([]),
        };
      }) as unknown as typeof Note.find;

      await request(app)
        .get('/api/notes?search=important')
        .set('Authorization', token);

      expect(capturedQuery).to.not.be.null;
      expect(capturedQuery!.userId.toString()).to.equal('60c72b2f9b1d8b2bad000001');
      expect(capturedQuery!.$or).to.exist;
      expect(capturedQuery!.$or![0].title.$regex).to.equal('important');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return specific note if found and owned by user', async () => {
      stubAuthSuccess();

      const mockNote = { _id: '60c72b2f9b1d8b2bad000123', title: 'Specific Note', content: 'Some details', userId: '60c72b2f9b1d8b2bad000001' };
      Note.findOne = (async (query: FilterQuery<INote>) => {
        if (query._id?.toString() === '60c72b2f9b1d8b2bad000123' && query.userId?.toString() === '60c72b2f9b1d8b2bad000001') {
          return mockNote;
        }
        return null;
      }) as unknown as typeof Note.findOne;

      const response = await request(app)
        .get('/api/notes/60c72b2f9b1d8b2bad000123')
        .set('Authorization', token);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.note.title).to.equal('Specific Note');
    });

    it('should return 400 if note ID format is invalid', async () => {
      stubAuthSuccess();

      const response = await request(app)
        .get('/api/notes/invalid-id-format')
        .set('Authorization', token);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Invalid note ID format');
    });

    it('should return 404 if note not found using a valid absent ID', async () => {
      stubAuthSuccess();

      Note.findOne = (async () => null) as unknown as typeof Note.findOne;

      const response = await request(app)
        .get('/api/notes/60c72b2f9b1d8b2bad000999')
        .set('Authorization', token);

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal('Note not found');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update note fields successfully', async () => {
      stubAuthSuccess();

      let saveCalled = false;
      const mockNote = {
        _id: '60c72b2f9b1d8b2bad000123',
        title: 'Old Title',
        content: 'Old Content',
        tags: [] as string[],
        isPinned: false,
        userId: '60c72b2f9b1d8b2bad000001',
        save: async function () {
          saveCalled = true;
          return this;
        },
      };

      Note.findOne = (async () => mockNote) as unknown as typeof Note.findOne;

      const response = await request(app)
        .put('/api/notes/60c72b2f9b1d8b2bad000123')
        .set('Authorization', token)
        .send({ title: 'Updated Title', isPinned: true });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(mockNote.title).to.equal('Updated Title');
      expect(mockNote.isPinned).to.be.true;
      expect(saveCalled).to.be.true;
    });

    it('should return 400 if note ID format is invalid on update', async () => {
      stubAuthSuccess();

      const response = await request(app)
        .put('/api/notes/invalid-id-format')
        .set('Authorization', token)
        .send({ title: 'New Title' });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Invalid note ID format');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete existing note successfully', async () => {
      stubAuthSuccess();

      let deleteOneCalled = false;
      const mockNote = {
        _id: '60c72b2f9b1d8b2bad000123',
        userId: '60c72b2f9b1d8b2bad000001',
        deleteOne: async () => {
          deleteOneCalled = true;
          return { deletedCount: 1 };
        },
      };

      Note.findOne = (async () => mockNote) as unknown as typeof Note.findOne;

      const response = await request(app)
        .delete('/api/notes/60c72b2f9b1d8b2bad000123')
        .set('Authorization', token);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('Note deleted successfully');
      expect(deleteOneCalled).to.be.true;
    });

    it('should return 400 if note ID format is invalid on delete', async () => {
      stubAuthSuccess();

      const response = await request(app)
        .delete('/api/notes/invalid-id-format')
        .set('Authorization', token);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Invalid note ID format');
    });
  });

  describe('GET /api/notes/export', () => {
    it('should export all user notes successfully', async () => {
      stubAuthSuccess();

      const mockNotes = [
        { _id: '60c72b2f9b1d8b2bad000111', title: 'Note A', content: 'Content A', isPinned: true, userId: '60c72b2f9b1d8b2bad000001' },
      ];

      Note.find = (() => ({
        sort: () => Promise.resolve(mockNotes),
      })) as unknown as typeof Note.find;

      const response = await request(app)
        .get('/api/notes/export')
        .set('Authorization', token);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.notes).to.be.an('array');
      expect(response.body.notes[0].title).to.equal('Note A');
    });
  });

  describe('POST /api/notes/import', () => {
    it('should import notes successfully', async () => {
      stubAuthSuccess();

      const notesToImport = [
        { title: 'Imported Note', content: 'Some imported content', tags: ['imported'] }
      ];

      Note.insertMany = (async (data: any) => {
        return data.map((item: any, idx: number) => ({
          ...item,
          _id: `60c72b2f9b1d8b2bad00099${idx}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }) as unknown as typeof Note.insertMany;

      const response = await request(app)
        .post('/api/notes/import')
        .set('Authorization', token)
        .send({ notes: notesToImport });

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.contain('notes imported successfully');
    });

    it('should return 400 if notes array is missing or empty', async () => {
      stubAuthSuccess();

      const response = await request(app)
        .post('/api/notes/import')
        .set('Authorization', token)
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Invalid notes format, expected an array');
    });
  });
});
