import { useParams, Link, useNavigate } from 'react-router-dom';
import SwipeReader from './SwipeReader';
import rupeeData   from '../../data/articles/rupee-depreciation.json';
import elNinoData  from '../../data/articles/super-el-nino.json';

const ARTICLES = {
  'rupee-depreciation': rupeeData,
  'super-el-nino':      elNinoData,
};

export default function ReadPage() {
  const { articleId } = useParams();
  const navigate      = useNavigate();
  const article       = ARTICLES[articleId];

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">Article not found</p>
          <p className="text-xs text-gray-400 mb-4">"{articleId}" doesn't exist yet.</p>
          <Link to="/current-affairs" className="btn-primary text-sm px-4 py-2">Browse articles</Link>
        </div>
      </div>
    );
  }

  return (
    /* Mobile: true full-screen (no header, no padding, edge-to-edge)
       Desktop: centered card on gray background */
    <div className="h-screen overflow-hidden" style={{ height: '100dvh' }}>
      <SwipeReader article={article} onClose={() => navigate('/current-affairs')} />
    </div>
  );
}
