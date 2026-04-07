const Diff = require('diff');
const Version = require('../models/Version');

/**
 * @route   GET /api/diff?v1=ID&v2=ID
 * @desc    Compute diff between two versions
 */
const getDiff = async (req, res, next) => {
  try {
    const { v1, v2 } = req.query;

    if (!v1 || !v2) {
      return res.status(400).json({ error: 'Both v1 and v2 version IDs are required' });
    }

    if (v1 === v2) {
      return res.status(400).json({ error: 'Cannot diff a version with itself' });
    }

    const [version1, version2] = await Promise.all([
      Version.findById(v1).populate('author', 'name email'),
      Version.findById(v2).populate('author', 'name email'),
    ]);

    if (!version1) {
      return res.status(404).json({ error: `Version ${v1} not found` });
    }
    if (!version2) {
      return res.status(404).json({ error: `Version ${v2} not found` });
    }

    // Ensure both versions belong to the same document
    if (version1.documentId.toString() !== version2.documentId.toString()) {
      return res.status(400).json({ error: 'Versions must belong to the same document' });
    }

    // Compute line-by-line diff
    const changes = Diff.diffLines(version1.content, version2.content);

    // Build structured diff result
    const diff = changes.map(part => ({
      value: part.value,
      added: !!part.added,
      removed: !!part.removed,
    }));

    // Compute stats
    const stats = {
      additions: changes.filter(p => p.added).reduce((sum, p) => sum + p.value.split('\n').filter(l => l).length, 0),
      deletions: changes.filter(p => p.removed).reduce((sum, p) => sum + p.value.split('\n').filter(l => l).length, 0),
    };

    res.json({
      version1: {
        id: version1._id,
        versionNumber: version1.versionNumber,
        author: version1.author,
        message: version1.message,
        createdAt: version1.createdAt,
      },
      version2: {
        id: version2._id,
        versionNumber: version2.versionNumber,
        author: version2.author,
        message: version2.message,
        createdAt: version2.createdAt,
      },
      diff,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDiff };
