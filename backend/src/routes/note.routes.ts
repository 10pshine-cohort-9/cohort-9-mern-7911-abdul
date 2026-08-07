import { Router } from 'express';
import { NoteController } from '../controllers/note.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', NoteController.createNote);
router.get('/', NoteController.getNotes);
router.get('/:id', NoteController.getNoteById);
router.put('/:id', NoteController.updateNote);
router.delete('/:id', NoteController.deleteNote);

export default router;
