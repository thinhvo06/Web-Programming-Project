const sequelize = require('../config/database');
const User = require('./User');
const Note = require('./Note');
const Label = require('./Label');
const NoteLabel = require('./NoteLabel');
const Attachment = require('./Attachment');
const NoteShare = require('./NoteShare');

// User <-> Note (Owner)
User.hasMany(Note, { foreignKey: 'user_id', as: 'notes', onDelete: 'CASCADE' });
Note.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// User <-> Label
User.hasMany(Label, { foreignKey: 'user_id', as: 'labels', onDelete: 'CASCADE' });
Label.belongsTo(User, { foreignKey: 'user_id' });

// Note <-> Label (Many-to-Many through NoteLabel)
// Crucial: Deleting a label removes NoteLabel links but DOES NOT delete the notes
Note.belongsToMany(Label, { through: NoteLabel, foreignKey: 'note_id', otherKey: 'label_id', as: 'labels' });
Label.belongsToMany(Note, { through: NoteLabel, foreignKey: 'label_id', otherKey: 'note_id', as: 'notes' });

// Note <-> Attachment
Note.hasMany(Attachment, { foreignKey: 'note_id', as: 'attachments', onDelete: 'CASCADE' });
Attachment.belongsTo(Note, { foreignKey: 'note_id' });

// Note <-> NoteShare
Note.hasMany(NoteShare, { foreignKey: 'note_id', as: 'shares', onDelete: 'CASCADE' });
NoteShare.belongsTo(Note, { foreignKey: 'note_id', as: 'note' });

// User <-> NoteShare (Recipient)
User.hasMany(NoteShare, { foreignKey: 'shared_with_user_id', as: 'received_shares', onDelete: 'CASCADE' });
NoteShare.belongsTo(User, { foreignKey: 'shared_with_user_id', as: 'recipient' });

module.exports = {
  sequelize,
  User,
  Note,
  Label,
  NoteLabel,
  Attachment,
  NoteShare
};
