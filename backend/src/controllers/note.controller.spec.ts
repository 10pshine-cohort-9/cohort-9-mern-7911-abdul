import { expect } from 'chai';
import request from 'supertest';
import app from '../app';
import { Note } from '../models/note.model';
import { User } from '../models/user.model';
import jwt from 'jsonwebtoken';

describe('Note API Endpoints', () => {
  const token = 'Bearer mock-valid-token';
  const mockUser = {
    _id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    tokenVersion: 0,
  };

  let originalCreate: any;
  let originalFind: any;
  let originalFindOne: any;
  let originalFindById: any;
  let originalVerify: any;

  before(() => {
    originalCreate = Note.create;
    originalFind = Note.find;
    originalFindOne = Note.findOne;
    originalFindById = User.findById;
    originalVerify = jwt.verify;
  });

  afterEach(() => {
    Note.create = originalCreate;
    Note.find = originalFind;
    Note.findOne = originalFindOne;
    User.findById = originalFindById;
    jwt.verify = originalVerify;
  });

  const stubAuthSuccess = () => {
    jwt.verify = (() => ({ id: 'user-123', tokenVersion: 0 })) as any;
    User.findById = (() => ({
      select: () => Promise.resolve(mockUser),
    })) as any;
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
          _id: 'note-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }) as any;

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', token)
        .send(noteData);

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Note created successfully');
      expect(response.body.note.title).to.equal('Work Tasks');
      expect(response.body.note.userId).to.equal('user-123');
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
        { _id: '1', title: 'Note A', content: 'Content A', isPinned: true, userId: 'user-123' },
        { _id: '2', title: 'Note B', content: 'Content B', isPinned: false, userId: 'user-123' },
      ];

      Note.find = (() => ({
        sort: () => Promise.resolve(mockNotes),
      })) as any;

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

      let capturedQuery: any = null;
      Note.find = ((query: any) => {
        capturedQuery = query;
        return {
          sort: () => Promise.resolve([]),
        };
      }) as any;

      await request(app)
        .get('/api/notes?search=important')
        .set('Authorization', token);

      expect(capturedQuery).to.not.be.null;
      expect(capturedQuery.userId).to.equal('user-123');
      expect(capturedQuery.$or).to.exist;
      expect(capturedQuery.$or[0].title.$regex).to.equal('important');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return specific note if found and owned by user', async () => {
      stubAuthSuccess();

      const mockNote = { _id: 'note-123', title: 'Specific Note', content: 'Some details', userId: 'user-123' };
      Note.findOne = (async (query: any) => {
        if (query._id === 'note-123' && query.userId === 'user-123') {
          return mockNote;
        }
        return null;
      }) as any;

      const response = await request(app)
        .get('/api/notes/note-123')
        .set('Authorization', token);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.note.title).to.equal('Specific Note');
    });

    it('should return 404 if note not found', async () => {
      stubAuthSuccess();

      Note.findOne = (async () => null) as any;

      const response = await request(app)
        .get('/api/notes/does-not-exist')
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
        _id: 'note-123',
        title: 'Old Title',
        content: 'Old Content',
        tags: [] as string[],
        isPinned: false,
        userId: 'user-123',
        save: async function () {
          saveCalled = true;
          return this;
        },
      };

      Note.findOne = (async () => mockNote) as any;

      const response = await request(app)
        .put('/api/notes/note-123')
        .set('Authorization', token)
        .send({ title: 'Updated Title', isPinned: true });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(mockNote.title).to.equal('Updated Title');
      expect(mockNote.isPinned).to.be.true;
      expect(saveCalled).to.be.true;
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete existing note successfully', async () => {
      stubAuthSuccess();

      let deleteOneCalled = false;
      const mockNote = {
        _id: 'note-123',
        userId: 'user-123',
        deleteOne: async () => {
          deleteOneCalled = true;
          return { deletedCount: 1 };
        },
      };

      Note.findOne = (async () => mockNote) as any;

      const response = await request(app)
        .delete('/api/notes/note-123')
        .set('Authorization', token);

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('Note deleted successfully');
      expect(deleteOneCalled).to.be.true;
    });
  });
});
