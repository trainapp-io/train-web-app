// import React, { useState, useEffect } from 'react';
// import { userProfileService } from '../../services/userProfileService';
// import { FaUser, FaSave, FaTimes } from 'react-icons/fa';
// import './ProfileEditor.css';
// import { UserProfileResponse } from '@trainapp-io/train-core';

// interface ProfileEditorProps {
//   userId?: string; // Optional: if not provided, edit current user's profile
//   onSave?: () => void;
//   onCancel?: () => void;
// }

// const ProfileEditor: React.FC<ProfileEditorProps> = ({ userId, onSave, onCancel }) => {
//   const [profile, setProfile] = useState<UserProfileResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
  
//   // Form state
//   const [name, setName] = useState('');
//   const [age, setAge] = useState<number | ''>('');
//   const [location, setLocation] = useState('');
//   const [bio, setBio] = useState('');
//   const [role, setRole] = useState('');
//   const [isPrivate, setIsPrivate] = useState(false);
//   const [tags, setTags] = useState<string[]>([]);
//   const [newTag, setNewTag] = useState('');
//   const [profilePicture, setProfilePicture] = useState<string | null>(null);
//   const [customSections, setCustomSections] = useState<Array<{title: string; details: string; id?: string}>>([]);

//   // Load profile data
//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         let profileData: UserProfileResponse;
        
//         if (userId) {
//           profileData = await userProfileService.getUserProfile(userId);
//         } else {
//           profileData = await userProfileService.getCurrentUserProfile();
//         }
        
//         setProfile(profileData);
        
//         // Initialize form state
//         setName(profileData.name || '');
//         setLocation(profileData.location || '');
//         setBio(profileData.bio || '');
//         setRole(profileData.role || '');
//         setIsPrivate(false);
//         setTags([]);
//         setProfilePicture(profileData.profilePicture || null);
//         setCustomSections(profileData.customSections?.map(section => ({
//           id: section.id,
//           title: section.title,
//           content: section.content
//         })) || []);
        
//       } catch (err) {
//         console.error('Error fetching profile:', err);
//         setError('Failed to load profile data. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchProfile();
//   }, [userId]);

//   // Handle form submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     try {
//       setSaving(true);
//       setError(null);
//       setSuccess(null);
      
//       // Prepare profile data
//       const profileData: Partial<UserProfile> = {
//         name,
//         location,
//         bio,
//         role,
//         profilePicture: profilePicture || undefined,
//       };
      
//       // Update profile
//       await userProfileService.updateUserProfile(profileData);
      
//       // Handle custom sections updates
//       if (profile?.customSections) {
//         const existingSectionIds = profile.customSections.map(section => section.id);
        
//         // Find sections to update or create
//         for (const section of customSections) {
//           if (section.id) {
//             // Update existing section
//             await userProfileService.updateCustomSection(section.id, {
//               title: section.title,
//               content: section.content
//             });
//           } else {
//             // Create new section
//             await userProfileService.addCustomSection(section.title, section.content);
//           }
//         }
        
//         // Find sections to delete
//         const currentSectionIds = customSections
//           .filter(section => section.id)
//           .map(section => section.id as string);
        
//         const sectionsToDelete = existingSectionIds.filter(
//           id => !currentSectionIds.includes(id as string)
//         );
        
//         for (const sectionId of sectionsToDelete) {
//           await userProfileService.deleteCustomSection(sectionId as string);
//         }
//       } else {
//         // Create all new sections
//         for (const section of customSections) {
//           await userProfileService.addCustomSection(section.title, section.content);
//         }
//       }
      
//       setSuccess('Profile updated successfully!');
      
//       // Call onSave callback if provided
//       if (onSave) {
//         onSave();
//       }
//     } catch (err) {
//       console.error('Error updating profile:', err);
//       setError('Failed to update profile. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Handle tag addition
//   const handleAddTag = () => {
//     if (newTag.trim() && !tags.includes(newTag.trim())) {
//       setTags([...tags, newTag.trim()]);
//       setNewTag('');
//     }
//   };

//   // Handle tag removal
//   const handleRemoveTag = (tagToRemove: string) => {
//     setTags(tags.filter(tag => tag !== tagToRemove));
//   };

//   // Handle custom section addition
//   const handleAddCustomSection = () => {
//     setCustomSections([...customSections, { title: '', details: '' }]);
//   };

//   // Handle custom section removal
//   const handleRemoveCustomSection = (index: number) => {
//     const updatedSections = [...customSections];
//     updatedSections.splice(index, 1);
//     setCustomSections(updatedSections);
//   };

//   // Handle custom section update
//   const handleUpdateCustomSection = (index: number, field: 'title' | 'details', value: string) => {
//     const updatedSections = [...customSections];
//     updatedSections[index][field] = value;
//     setCustomSections(updatedSections);
//   };

//   if (loading) {
//     return <div className="profile-editor-loading">Loading profile data...</div>;
//   }

//   return (
//     <div className="profile-editor">
//       <h2>Edit Profile</h2>
      
//       {error && <div className="profile-editor-error">{error}</div>}
//       {success && <div className="profile-editor-success">{success}</div>}
      
//       <form onSubmit={handleSubmit}>
//         <div className="profile-editor-section">
//           <h3>Basic Information</h3>
          
//           <div className="profile-editor-field">
//             <label htmlFor="name">Name</label>
//             <input
//               type="text"
//               id="name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required
//             />
//           </div>
          
//           <div className="profile-editor-field">
//             <label htmlFor="age">Age</label>
//             <input
//               type="number"
//               id="age"
//               value={age}
//               onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
//               min="1"
//               max="120"
//             />
//           </div>
          
//           <div className="profile-editor-field">
//             <label htmlFor="location">Location</label>
//             <input
//               type="text"
//               id="location"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//             />
//           </div>
          
//           <div className="profile-editor-field">
//             <label htmlFor="role">Role</label>
//             <input
//               type="text"
//               id="role"
//               value={role}
//               onChange={(e) => setRole(e.target.value)}
//               placeholder="e.g., Trainer, Athlete, Nutritionist"
//             />
//           </div>
          
//           <div className="profile-editor-field">
//             <label htmlFor="bio">Bio</label>
//             <textarea
//               id="bio"
//               value={bio}
//               onChange={(e) => setBio(e.target.value)}
//               rows={4}
//               placeholder="Tell others about yourself..."
//             />
//           </div>
          
//           <div className="profile-editor-field profile-editor-checkbox">
//             <input
//               type="checkbox"
//               id="isPrivate"
//               checked={isPrivate}
//               onChange={(e) => setIsPrivate(e.target.checked)}
//             />
//             <label htmlFor="isPrivate">Private Profile</label>
//           </div>
//         </div>
        
//         <div className="profile-editor-section">
//           <h3>Profile Picture</h3>
//           <div className="profile-picture-preview">
//             {profilePicture ? (
//               <img src={profilePicture} alt="Profile" />
//             ) : (
//               <div className="profile-picture-placeholder">
//                 <FaUser />
//               </div>
//             )}
//           </div>
//           <div className="profile-editor-field">
//             <label htmlFor="profilePicture">Profile Picture URL</label>
//             <input
//               type="text"
//               id="profilePicture"
//               value={profilePicture || ''}
//               onChange={(e) => setProfilePicture(e.target.value)}
//               placeholder="Enter image URL"
//             />
//           </div>
//         </div>
        
//         <div className="profile-editor-section">
//           <h3>Tags</h3>
//           <div className="profile-editor-tags">
//             {tags.map((tag, index) => (
//               <div key={index} className="profile-editor-tag">
//                 <span>{tag}</span>
//                 <button 
//                   type="button" 
//                   onClick={() => handleRemoveTag(tag)}
//                   aria-label="Remove tag"
//                 >
//                   <FaTimes />
//                 </button>
//               </div>
//             ))}
//           </div>
//           <div className="profile-editor-field profile-editor-tag-input">
//             <input
//               type="text"
//               value={newTag}
//               onChange={(e) => setNewTag(e.target.value)}
//               placeholder="Add a tag"
//               onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
//             />
//             <button type="button" onClick={handleAddTag}>Add</button>
//           </div>
//         </div>
        
//         <div className="profile-editor-section">
//           <h3>Custom Sections</h3>
//           {customSections.map((section, index) => (
//             <div key={index} className="profile-editor-custom-section">
//               <div className="profile-editor-field">
//                 <label>Section Title</label>
//                 <input
//                   type="text"
//                   value={section.title}
//                   onChange={(e) => handleUpdateCustomSection(index, 'title', e.target.value)}
//                   placeholder="Section Title"
//                   required
//                 />
//               </div>
//               <div className="profile-editor-field">
//                 <label>Details</label>
//                 <textarea
//                   value={section.details}
//                   onChange={(e) => handleUpdateCustomSection(index, 'details', e.target.value)}
//                   rows={3}
//                   placeholder="Section Details"
//                   required
//                 />
//               </div>
//               <button
//                 type="button"
//                 className="profile-editor-remove-section"
//                 onClick={() => handleRemoveCustomSection(index)}
//               >
//                 Remove Section
//               </button>
//             </div>
//           ))}
//           <button
//             type="button"
//             className="profile-editor-add-section"
//             onClick={handleAddCustomSection}
//           >
//             Add Custom Section
//           </button>
//         </div>
        
//         <div className="profile-editor-actions">
//           <button
//             type="button"
//             className="profile-editor-cancel"
//             onClick={onCancel}
//             disabled={saving}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="profile-editor-save"
//             disabled={saving}
//           >
//             {saving ? 'Saving...' : (
//               <>
//                 <FaSave /> Save Profile
//               </>
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default ProfileEditor;
