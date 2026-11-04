import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import { Shell } from './components/Shell.jsx';
import { Landing } from './pages/Landing.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { Languages } from './pages/Languages.jsx';
import { Settings } from './pages/Settings.jsx';
import { LanguageDetails } from './pages/LanguageDetails.jsx';
import { Learning } from './pages/Learning.jsx';
import { CharacterDetails } from './pages/CharacterDetails.jsx';
import { Vocabulary } from './pages/Vocabulary.jsx';
import { Dictionary } from './pages/Dictionary.jsx';
import { Grammar } from './pages/Grammar.jsx';
import { Sentences } from './pages/Sentences.jsx';
import { Courses } from './pages/Courses.jsx';
import { CourseLesson } from './pages/CourseLesson.jsx';
import { AssessmentPage } from './pages/AssessmentPage.jsx';
import { Listening } from './pages/Listening.jsx';
import { Speaking } from './pages/Speaking.jsx';
import { Tutor } from './pages/Tutor.jsx';
import { Conversations } from './pages/Conversations.jsx';
import { CourseAdmin } from './pages/CourseAdmin.jsx';
import { Culture } from './pages/Culture.jsx';
import { Communities } from './pages/Communities.jsx';
import { Contribute } from './pages/Contribute.jsx';
import { CommunityTalk } from './pages/CommunityTalk.jsx';
import { CulturalReview } from './pages/CulturalReview.jsx';
import { MyCommunity } from './pages/MyCommunity.jsx';
import { CulturalDetail } from './pages/CulturalDetail.jsx';

function Guard({ children }) { const { user, loading } = useAuth(); if (loading) return <div className="screen-loading">Opening your learning space…</div>; return user ? children : <Navigate to="/login" replace />; }
export default function App() {
  return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route element={<Guard><Shell /></Guard>}><Route path="/home" element={<Dashboard />} /><Route path="/languages" element={<Languages />} /><Route path="/languages/:id" element={<LanguageDetails />} /><Route path="/learn" element={<Learning />} /><Route path="/learn/characters/:id" element={<CharacterDetails />} /><Route path="/vocabulary" element={<Vocabulary />} /><Route path="/dictionary" element={<Dictionary />} /><Route path="/grammar" element={<Grammar />} /><Route path="/sentences" element={<Sentences />} /><Route path="/courses" element={<Courses />} /><Route path="/courses/:id" element={<Courses />} /><Route path="/courses/:courseId/lesson/:lessonId" element={<CourseLesson />} /><Route path="/assessments/:id" element={<AssessmentPage />} /><Route path="/listening" element={<Listening />} /><Route path="/speaking" element={<Speaking />} /><Route path="/conversations" element={<Conversations />} /><Route path="/culture" element={<Culture />} /><Route path="/culture/:id" element={<CulturalDetail kind="culture" />} /><Route path="/stories/:id" element={<CulturalDetail kind="story" />} /><Route path="/cultural-media/:id" element={<CulturalDetail kind="media" />} /><Route path="/communities" element={<Communities />} /><Route path="/contribute" element={<Contribute />} /><Route path="/my-community" element={<MyCommunity />} /><Route path="/discussions" element={<CommunityTalk />} /><Route path="/admin/culture" element={<CulturalReview />} /><Route path="/tutor" element={<Tutor />} /><Route path="/admin/courses" element={<CourseAdmin />} /><Route path="/settings" element={<Settings />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
