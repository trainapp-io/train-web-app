import React, { useState } from "react";
import "./ProgramBuilder.css";

// Step components
import ProgramNameStep from "../components/programBuilder/ProgramNameStep";
import ProgramFrequencyStep from "../components/programBuilder/ProgramFrequencyStep";
import NutritionStep from "../components/programBuilder/NutritionStep";
import VisibilityStep from "../components/programBuilder/VisibilityStep";
import { useNavigate } from "react-router"; // if using React Router v6
import { programService } from "../services/programService";
import { ProgramRequest, ProfileAccess } from "@trainapp-io/train-core";
import { tokenService } from '../../../services/tokenService';

import { IoClose } from 'react-icons/io5';
import logo from '../../../assets/logo.svg';

import { faro, LogLevel} from "@grafana/faro-react";

interface ProgramPhase {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
}

interface ProgramData {
  name: string;
  types: string[];
  weeks: number;
  includesNutrition: boolean;
  phases: ProgramPhase[];
  isPublic: boolean;
}

const ProgramBuilder: React.FC = () => {
  const navigate = useNavigate(); // replaces history.push in v6
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = tokenService.getUser();
  const userId = JSON.parse(user!).userId;

  const [currentStep, setCurrentStep] = useState(0);
  const [programData, setProgramData] = useState<ProgramData>({
    name: "",
    types: [],
    weeks: 4,
    includesNutrition: false,
    phases: [{ id: "1", name: "Phase 1", startWeek: 1, endWeek: 4 }],
    isPublic: false,
  });

  const steps = [
    { title: "Let's Get Started", component: ProgramNameStep },
    { title: "What is your Program Frequency?", component: ProgramFrequencyStep },
    { title: "Does your program include nutrition?", component: NutritionStep },
    { title: "Want to share your program or keep it private?", component: VisibilityStep },
  ];

  const updateProgramData = (updates: Partial<ProgramData>) => {
    setProgramData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Map the form data to the API request format
  const mapFormDataToApiRequest = (): ProgramRequest => {
    // Format phases to match API requirements
    const formattedPhases = programData.phases.map(phase => ({
      name: phase.name,
      startWeek: phase.startWeek,
      endWeek: phase.endWeek
    }));

    // Map access type based on isPublic flag
    const accessType = programData.isPublic ? ProfileAccess.Public : ProfileAccess.Private;

    return {
      name: programData.name,
      types: programData.types.map(type => type.toLowerCase()),
      numWeeks: programData.weeks,
      hasNutritionProgram: programData.includesNutrition,
      phases: formattedPhases,
      accessType: accessType,
      admins: [userId],
      createdBy: userId,
    };
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      
      // Map form data to API request format
      const programRequest = mapFormDataToApiRequest();
      
      console.log("Submitting program data:", programRequest);
      
      // Call the API to create the program
      const response = await programService.createProgram(programRequest);

      faro.api.pushLog(["Program created successfully"], {
        level: LogLevel.INFO,
        context: {
          programId: response.id,
          userId: userId
        }
      })
      
      console.log("Program created successfully:", response);
      // Navigate back to the programs page
      navigate("/programs");
    } catch (error) {
      console.error("Error creating program:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepComponent = steps[currentStep].component;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="program-builder">
      <button 
        className="builder-close-button"
        onClick={() => navigate('/programs')}
        aria-label="Close builder"
      >
        <IoClose />
      </button>
      <div className="program-builder-container">
      
      {/* Left Sidebar - Always visible */}
      <div className="builder-sidebar-full">
        <div className="builder-logo-container">
          <img src={logo} alt="Train Logo" className="builder-logo" />
        </div>
        <h3 className="builder-logo-subtitle">Program Builder</h3>
        <p className="builder-quote">
          "The only bad workout is the one that didn't happen."
        </p>
      </div>

      {/* Right Content Area */}
      <div className="program-builder-content-area">
        {/* Progress bar */}
        <div className="program-builder-progress">
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="progress-steps">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`progress-step ${index <= currentStep ? "active" : ""}`}
              />
            ))}
          </div>
        </div>

        {currentStep !== 0 && (
          <h1 className="program-builder-title">{steps[currentStep].title}</h1>
        )}

        <div className="program-builder-step">
          <StepComponent
            programData={programData}
            updateProgramData={updateProgramData}
          />
        </div>

        <div className="program-builder-actions">
          {currentStep > 0 && (
            <button 
              className="back-btn"
              onClick={handleBack} 
              disabled={isSubmitting}
            >
              Back
            </button>
          )}
          <button 
            className={currentStep === 0 ? "continue-btn" : "next-btn"}
            onClick={handleNext} 
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? "Submitting..." 
              : currentStep === steps.length - 1
                ? "Finish"
                : currentStep === 0
                  ? "Continue"
                  : "Next"
            }
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ProgramBuilder;
