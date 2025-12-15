import React from "react";
import { Routes, Route } from "react-router";
import Sidebar from "../components/Sidebar";
import ContentView from "../components/ContentView";
import Home from "./Home";
import Profile from "../app/profiles/views/Profile";

import Events from "../app/events/views/EventsPage";
import Search from "../app/search/views/Search";
import Programs from "../app/programs/views/Programs";
import ProgramBuilder from "../app/programs/views/ProgramBuilder";
import ProgramView from "../app/programs/views/ProgramView";
import WeekView from "../app/programs/views/WeekView";
import WorkoutView from "../app/programs/views/WorkoutView";
import { ProgramProvider } from "../app/programs/contexts/ProgramContext";
import WorkoutLogCreate from "../app/workout-logs/pages/WorkoutLogCreate";
import WorkoutLogDetail from "../app/workout-logs/pages/WorkoutLogDetail";
import WorkoutLogEdit from "../app/workout-logs/pages/WorkoutLogEdit";
import WorkoutLogHistory from "../app/workout-logs/pages/WorkoutLogHistory";

import {
  AiOutlineHome,
  AiOutlineUser,
  // AiOutlineTeam,
  // AiOutlineCalendar,
  AiOutlineSearch,
  AiOutlineSchedule,
  AiOutlineCheckCircle
} from "react-icons/ai";

const Dashboard: React.FC = () => {
  const tabs = [
    { id: "", label: "Home", icon: <AiOutlineHome /> }, // id "" so route = "/"
    { id: "programs", label: "Programs", icon: <AiOutlineSchedule /> },
    { id: "workout-logs/history", label: "Workout Logs", icon: <AiOutlineCheckCircle /> },
    { id: "profile", label: "Profile", icon: <AiOutlineUser /> },
    // { id: "groups", label: "Groups", icon: <AiOutlineTeam /> },
    // { id: "events", label: "Events", icon: <AiOutlineCalendar /> },
    { id: "search", label: "Search", icon: <AiOutlineSearch /> },
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
            <Route path="/search" element={<Search />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/programs/builder" element={<ProgramBuilder />} />
            <Route path="/programs/:programId" element={<ProgramView />} />
            <Route path="/programs/:programId/weeks/:weekId" element={<WeekView />} />
            <Route path="/programs/:programId/weeks/:weekId/workouts/:workoutId" element={<WorkoutView />} />
            
            {/* Workout Log Routes */}
            <Route path="/workout-logs/history" element={<WorkoutLogHistory />} />
            <Route path="/workout-logs/:logId" element={<WorkoutLogDetail />} />
            <Route path="/workout-logs/:logId/edit" element={<WorkoutLogEdit />} />
            <Route path="/programs/:programId/weeks/:weekId/workouts/:workoutId/log" element={<WorkoutLogCreate />} />
          </Routes>
        </ProgramProvider>
      </ContentView>
    </div>
  );
};

export default Dashboard;
