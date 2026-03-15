import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedProperty extends Document {
  userId: string;
  propertyId: string;
  savedAt: Date;
}

const SavedPropertySchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
    default: 'anonymous', // For demo/case-study purposes assuming no auth
  },
  propertyId: {
    type: String,
    required: true,
    index: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate saves
SavedPropertySchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export const SavedProperty = mongoose.model<ISavedProperty>('SavedProperty', SavedPropertySchema);
