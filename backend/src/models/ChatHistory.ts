import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  propertyIds?: string[]; // Optional: IDs of properties recommended in this turn
}

export interface IChatHistory extends Document {
  sessionId: string;
  messages: IChatMessage[];
  updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  propertyIds: [{ type: String }],
});

const ChatHistorySchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  messages: [ChatMessageSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
ChatHistorySchema.pre<IChatHistory>('save', function (next: any) {
  this.updatedAt = new Date();
  next();
});

export const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);
