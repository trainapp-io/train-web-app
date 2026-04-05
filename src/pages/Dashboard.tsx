import React from "react";
import { Routes, Route } from "react-router";
import Sidebar from "../components/Sidebar";
import ContentView from "../components/ContentView";
import Home from "./Home";
import Profile from "../app/profiles/views/Profile";

import Events from "../app/events/views/EventsPage";
import { AvailabilityCalendar } from "../app/events/components/availability";
import Search from "../app/search/views/Search";
import Programs from "../app/programs/views/Programs";
import ProgramBuilder from "../app/programs/views/ProgramBuilder";
import ProgramView from "../app/programs/views/ProgramView";
import WeekView from "../app/programs/views/WeekView";
import ProgramWorkoutView from "../app/programs/views/ProgramWorkoutView";
import Workouts from "../app/workouts/views/Workouts";
import { ProgramProvider } from "../app/programs/contexts/ProgramContext";
import WorkoutLogCreate from "../app/workout-logs/pages/WorkoutLogCreate";
import WorkoutLogDetail from "../app/workout-logs/pages/WorkoutLogDetail";
import WorkoutLogEdit from "../app/workout-logs/pages/WorkoutLogEdit";
import WorkoutLogHistory from "../app/workout-logs/pages/WorkoutLogHistory";
import { WorkoutProvider } from "../app/workouts/contexts/WorkoutContext";
import WorkoutView from "../app/workouts/views/WorkoutView";

import { LuHouse, LuCalendarDays, LuDumbbell, LuClipboardList, LuUser, LuCalendar, LuSearch, LuUsers } from "react-icons/lu";
import CrmPage from "../app/crm/views/CrmPage";
import ClientProfilePage from "../app/crm/views/ClientProfilePage";

const Dashboard: React.FC = () => {
  const tabs = [
    { id: "", label: "Home", icon: <LuHouse /> },
    { id: "programs", label: "Programs", icon: <LuCalendarDays /> },
    { id: "workouts", label: "Workouts", icon: <LuDumbbell /> },
    { id: "workout-logs/history", label: "Workout Logs", icon: <LuClipboardList /> },
    { id: "profile", label: "Profile", icon: <LuUser /> },
    { id: "events", label: "Events", icon: <LuCalendar /> },
    { id: "search", label: "Search", icon: <LuSearch /> },
    { id: "crm", label: "Clients", icon: <LuUsers /> },
    ];

  return (
    <div className="app-container">
      <Sidebar tabs={tabs} />
      <ContentView>
        <ProgramProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/events" element={<Events />} />
            <Route path="/availability/:slotId" element={<AvailabilityCalendar />} />
            <Route path="/search" element={<Search />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/programs/builder" element={<ProgramBuilder />} />
            <Route path="/programs/:programId" element={<ProgramView />} />
            <Route path="/programs/:programId/weeks/:weekId" element={<WeekView />} />
            <Route path="/programs/:programId/weeks/:weekId/workouts/:workoutId" element={<ProgramWorkoutView />} />
            
            {/* Workout Log Routes */}
            <Route path="/workout-logs/history" element={<WorkoutLogHistory />} />
            <Route path="/workout-logs/:logId" element={<WorkoutLogDetail />} />
            <Route path="/workout-logs/:logId/edit" element={<WorkoutLogEdit />} />
            <Route path="/programs/:programId/weeks/:weekId/workouts/:workoutId/log" element={<WorkoutLogCreate />} />
            <Route path="/workouts/:workoutId/log" element={<WorkoutLogCreate />} />
            <Route path="/crm" element={<CrmPage />} />
            <Route path="/crm/clients/:clientId" element={<ClientProfilePage />} />
          </Routes>
        </ProgramProvider>
        <WorkoutProvider>
          <Routes>
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/create" element={<WorkoutView />} />
            <Route path="/workouts/:workoutId" element={<WorkoutView />} />
            <Route path="/workouts/:workoutId/edit" element={<WorkoutView />} />
          </Routes>
        </WorkoutProvider>
      </ContentView>
    </div>
  );
};

export default Dashboard;
