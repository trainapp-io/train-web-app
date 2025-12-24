// // WorkoutView/components/MuscleGroupsEditor.tsx
// import React from 'react';
// import { MuscleGroup } from '@trainapp-io/train-core';

// interface Props {
//   muscleGroups: MuscleGroup[];
//   editMode: boolean;
//   workout: WorkoutRequest;
//   setWorkout: (updated: WorkoutRequest) => void;
// }

// const MuscleGroupsEditor: React.FC<Props> = ({ muscleGroups, editMode, workout, setWorkout }) => {
//   const updateGroups = (updated: MuscleGroup[]) => {
//     setWorkout({ ...workout, muscleGroups: updated });
//   };

//   const groups = muscleGroups || [];

//   if (!editMode) {
//     return (
//       <div className="muscle-groups-section">
//         <h3>Muscle Groups</h3>
//         <div className="combined-percentage-bar">
//           {groups.map((g, i) => (
//             <div
//               key={i}
//               className={`percentage-segment segment-color-${i % 8}`}
//               style={{ width: `${g.percentage}%` }}
//             />
//           ))}
//         </div>
//         <div className="muscle-group-labels">
//           {groups.map((g, i) => (
//             <div key={i} className="muscle-group-label" style={{ width: `${g.percentage}%` }}>
//               <span className="muscle-name">{g.name}</span>
//               <span className="muscle-percentage">{g.percentage}%</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="muscle-groups-section">
//       <h3>Muscle Groups</h3>
//       <div className="muscle-groups-list">
//         {groups.map((g, i) => (
//           <div key={i} className="muscle-group-item">
//             <input
//               type="text"
//               value={g.name}
//               onChange={(e) => {
//                 const updated = [...groups];
//                 updated[i].name = e.target.value;
//                 updateGroups(updated);
//               }}
//               placeholder="Muscle group"
//               className="muscle-group-name-input"
//             />
//             <input
//               type="number"
//               value={g.percentage}
//               onChange={(e) => {
//                 const updated = [...groups];
//                 updated[i].percentage = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
//                 updateGroups(updated);
//               }}
//               min={0}
//               max={100}
//               className="muscle-group-percentage-input"
//             />
//             <span className="percentage-symbol">%</span>
//             <button
//               onClick={() => {
//                 const updated = groups.filter((_, idx) => idx !== i);
//                 updateGroups(updated);
//               }}
//               className="remove-muscle-group-btn"
//             >
//               ✕
//             </button>
//           </div>
//         ))}

//         <div className="muscle-groups-actions">
//           <button
//             onClick={() => {
//               if (groups.reduce((s, g) => s + g.percentage, 0) >= 100) return;
//               updateGroups([
//                 ...groups,
//                 { name: 'New Group', percentage: 0 },
//               ]);
//             }}
//             className="add-muscle-group-btn"
//           >
//             + Add Muscle Group
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MuscleGroupsEditor;
