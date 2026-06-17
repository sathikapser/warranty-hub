const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const Asset = require('../models/Asset');
const { upload, handleUpload } = require('../middleware/fileUpload');
const { protect } = require('../middleware/auth');
const { performOCR } = require('../utils/ocr');
const fs = require('fs');

// @desc    Upload document to vault
// @route   POST /api/documents/upload
// @access  Private
router.post('/upload', protect, upload.single('file'), handleUpload, async (req, res) => {
  const { assetId, documentType, fileName } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const document = await Document.create({
      assetId,
      fileUrl: req.file.fileUrl,
      documentType: documentType || 'other',
      publicId: req.file.publicId,
      fileName: fileName || req.file.originalname
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Scan invoice image using OCR
// @route   POST /api/documents/scan-invoice
// @access  Private
router.post('/scan-invoice', protect, upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an invoice image' });
    }

    console.log('Starting OCR scanning for:', req.file.path);
    const ocrResult = await performOCR(req.file.path);

    // Clean up local file after scanning (it was a temp upload)
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp OCR invoice file:', err);
    });

    res.json(ocrResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all documents for an asset
// @route   GET /api/documents/asset/:assetId
// @access  Private
router.get('/asset/:assetId', protect, async (req, res) => {
  try {
    const documents = await Document.find({ assetId: req.params.assetId });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all documents in the vault (workspace level)
// @route   GET /api/documents/vault
// @access  Private
router.get('/vault', protect, async (req, res) => {
  try {
    // Find all assets user has access to
    const ownerId = req.user.familyWorkspaceOwnerId || req.user._id;
    const assets = await Asset.find({ 
      $or: [
        { userId: ownerId },
        { userId: req.user._id }
      ]
    });
    const assetIds = assets.map(a => a._id);

    const documents = await Document.find({ assetId: { $in: assetIds } }).populate('assetId', 'assetName category brand');
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Optional Cloudinary deletion if public_id exists
    if (document.publicId && process.env.CLOUDINARY_CLOUD_NAME) {
      const cloudinary = require('cloudinary').v2;
      await cloudinary.uploader.destroy(document.publicId);
    } else {
      // Local deletion
      const filename = document.fileUrl.split('/').pop();
      const localFilePath = require('path').join(__dirname, '../uploads', filename);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }

    await document.deleteOne();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
