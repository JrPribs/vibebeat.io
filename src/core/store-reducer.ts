import { AppState, AppAction } from '../shared/models';

// Initial state
export const initialState: AppState = {
  audio: {
    isPlaying: false,
    currentStep: 0,
    bpm: 120,
    masterVolume: 0.8,
    isInitialized: false,
    currentKit: null,
    pattern: null,
    swing: 0,
    quantize: true,
    timeSignature: [4, 4]
  },
  ui: {
    currentView: 'pads',
    isLoading: false,
    error: null,
    theme: 'dark',
    sidebarOpen: true,
    modalStack: [],
    notifications: []
  },
  project: {
    currentProject: null,
    projects: [],
    isDirty: false,
    lastSaved: null,
    autoSave: true
  },
  factory: {
    isLoading: false,
    error: null,
    kits: [],
    samples: [],
    instruments: [],
    categories: [],
    searchQuery: '',
    selectedCategory: null,
    currentContent: null
  },
  export: {
    isExporting: false,
    progress: 0,
    error: null,
    format: 'wav',
    quality: 'high',
    includeMetadata: true
  },
  ai: {
    isGenerating: false,
    error: null,
    suggestions: [],
    currentPrompt: '',
    generationHistory: [],
    provider: 'openai'
  }
};

// Reducer function
export function storeReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Audio actions
    case 'AUDIO_SET_PLAYING':
      return {
        ...state,
        audio: {
          ...state.audio,
          isPlaying: action.payload
        }
      };

    case 'AUDIO_SET_CURRENT_STEP':
      return {
        ...state,
        audio: {
          ...state.audio,
          currentStep: action.payload
        }
      };

    case 'AUDIO_SET_BPM':
      return {
        ...state,
        audio: {
          ...state.audio,
          bpm: action.payload
        }
      };

    case 'AUDIO_SET_MASTER_VOLUME':
      return {
        ...state,
        audio: {
          ...state.audio,
          masterVolume: action.payload
        }
      };

    case 'AUDIO_SET_INITIALIZED':
      return {
        ...state,
        audio: {
          ...state.audio,
          isInitialized: action.payload
        }
      };

    case 'AUDIO_SET_CURRENT_KIT':
      return {
        ...state,
        audio: {
          ...state.audio,
          currentKit: action.payload
        }
      };

    case 'AUDIO_SET_PATTERN':
      return {
        ...state,
        audio: {
          ...state.audio,
          pattern: action.payload
        },
        project: {
          ...state.project,
          isDirty: true
        }
      };

    case 'AUDIO_SET_SWING':
      return {
        ...state,
        audio: {
          ...state.audio,
          swing: action.payload
        }
      };

    case 'AUDIO_SET_QUANTIZE':
      return {
        ...state,
        audio: {
          ...state.audio,
          quantize: action.payload
        }
      };

    case 'AUDIO_SET_TIME_SIGNATURE':
      return {
        ...state,
        audio: {
          ...state.audio,
          timeSignature: action.payload
        }
      };

    // UI actions
    case 'UI_SET_CURRENT_VIEW':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentView: action.payload
        }
      };

    case 'UI_SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload
        }
      };

    case 'UI_SET_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload
        }
      };

    case 'UI_SET_THEME':
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload
        }
      };

    case 'UI_TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen
        }
      };

    case 'UI_PUSH_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalStack: [...state.ui.modalStack, action.payload]
        }
      };

    case 'UI_POP_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalStack: state.ui.modalStack.slice(0, -1)
        }
      };

    case 'UI_ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, action.payload]
        }
      };

    case 'UI_REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload)
        }
      };

    // Project actions
    case 'PROJECT_SET_CURRENT':
      return {
        ...state,
        project: {
          ...state.project,
          currentProject: action.payload,
          isDirty: false
        }
      };

    case 'PROJECT_ADD':
      return {
        ...state,
        project: {
          ...state.project,
          projects: [...state.project.projects, action.payload]
        }
      };

    case 'PROJECT_UPDATE':
      return {
        ...state,
        project: {
          ...state.project,
          projects: state.project.projects.map(p => 
            p.id === action.payload.id ? action.payload : p
          ),
          currentProject: state.project.currentProject?.id === action.payload.id 
            ? action.payload 
            : state.project.currentProject,
          isDirty: false,
          lastSaved: Date.now()
        }
      };

    case 'PROJECT_DELETE':
      return {
        ...state,
        project: {
          ...state.project,
          projects: state.project.projects.filter(p => p.id !== action.payload),
          currentProject: state.project.currentProject?.id === action.payload 
            ? null 
            : state.project.currentProject
        }
      };

    case 'PROJECT_SET_DIRTY':
      return {
        ...state,
        project: {
          ...state.project,
          isDirty: action.payload
        }
      };

    case 'PROJECT_SET_AUTO_SAVE':
      return {
        ...state,
        project: {
          ...state.project,
          autoSave: action.payload
        }
      };

    // Factory actions
    case 'FACTORY_SET_LOADING':
      return {
        ...state,
        factory: {
          ...state.factory,
          isLoading: action.payload
        }
      };

    case 'FACTORY_SET_ERROR':
      return {
        ...state,
        factory: {
          ...state.factory,
          error: action.payload
        }
      };

    case 'FACTORY_SET_KITS':
      return {
        ...state,
        factory: {
          ...state.factory,
          kits: action.payload
        }
      };

    case 'FACTORY_SET_SAMPLES':
      return {
        ...state,
        factory: {
          ...state.factory,
          samples: action.payload
        }
      };

    case 'FACTORY_SET_INSTRUMENTS':
      return {
        ...state,
        factory: {
          ...state.factory,
          instruments: action.payload
        }
      };

    case 'FACTORY_SET_CATEGORIES':
      return {
        ...state,
        factory: {
          ...state.factory,
          categories: action.payload
        }
      };

    case 'FACTORY_SET_SEARCH_QUERY':
      return {
        ...state,
        factory: {
          ...state.factory,
          searchQuery: action.payload
        }
      };

    case 'FACTORY_SET_SELECTED_CATEGORY':
      return {
        ...state,
        factory: {
          ...state.factory,
          selectedCategory: action.payload
        }
      };

    case 'FACTORY_SET_CURRENT_CONTENT':
      return {
        ...state,
        factory: {
          ...state.factory,
          currentContent: action.payload
        }
      };

    // Export actions
    case 'EXPORT_SET_EXPORTING':
      return {
        ...state,
        export: {
          ...state.export,
          isExporting: action.payload
        }
      };

    case 'EXPORT_SET_PROGRESS':
      return {
        ...state,
        export: {
          ...state.export,
          progress: action.payload
        }
      };

    case 'EXPORT_SET_ERROR':
      return {
        ...state,
        export: {
          ...state.export,
          error: action.payload
        }
      };

    case 'EXPORT_SET_FORMAT':
      return {
        ...state,
        export: {
          ...state.export,
          format: action.payload
        }
      };

    case 'EXPORT_SET_QUALITY':
      return {
        ...state,
        export: {
          ...state.export,
          quality: action.payload
        }
      };

    case 'EXPORT_SET_INCLUDE_METADATA':
      return {
        ...state,
        export: {
          ...state.export,
          includeMetadata: action.payload
        }
      };

    // AI actions
    case 'AI_SET_GENERATING':
      return {
        ...state,
        ai: {
          ...state.ai,
          isGenerating: action.payload
        }
      };

    case 'AI_SET_ERROR':
      return {
        ...state,
        ai: {
          ...state.ai,
          error: action.payload
        }
      };

    case 'AI_SET_SUGGESTIONS':
      return {
        ...state,
        ai: {
          ...state.ai,
          suggestions: action.payload
        }
      };

    case 'AI_SET_CURRENT_PROMPT':
      return {
        ...state,
        ai: {
          ...state.ai,
          currentPrompt: action.payload
        }
      };

    case 'AI_ADD_TO_HISTORY':
      return {
        ...state,
        ai: {
          ...state.ai,
          generationHistory: [...state.ai.generationHistory, action.payload]
        }
      };

    case 'AI_SET_PROVIDER':
      return {
        ...state,
        ai: {
          ...state.ai,
          provider: action.payload
        }
      };

    default:
      return state;
  }
}