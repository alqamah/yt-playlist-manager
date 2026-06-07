import { Router, Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { Playlist } from '../models/Playlist';

export const categoriesRouter = Router();

// Middleware to ensure user is logged in
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }
  next();
}

/**
 * Endpoint to list all categories for the authenticated user.
 */
categoriesRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  try {
    const categories = await Category.find({ userId }).sort({ orderIndex: 1 });
    res.json(categories);
  } catch (err) {
    console.error('Error listing categories:', err);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

/**
 * Endpoint to create a new category.
 */
categoriesRouter.post('/', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { name, color } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    // Determine the next orderIndex
    const lastCategory = await Category.findOne({ userId }).sort({ orderIndex: -1 });
    const orderIndex = lastCategory ? lastCategory.orderIndex + 1 : 0;

    const newCategory = new Category({
      userId,
      name: name.trim(),
      color: color || '#00f0ff',
      orderIndex
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

/**
 * Endpoint to delete a category and reset associated playlists' categoryId.
 */
categoriesRouter.delete('/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const categoryId = req.params.id;

  try {
    const deletedCategory = await Category.findOneAndDelete({ _id: categoryId, userId });
    if (!deletedCategory) {
      return res.status(404).json({ error: 'Category not found or unauthorized' });
    }

    // Detach deleted category from all playlists
    await Playlist.updateMany(
      { userId, categoryId },
      { $set: { categoryId: null, isDirty: true } }
    );

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});
