import { useState } from 'react';

const CoverLetter = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 240;

  return (
    <div>
      <p className="text-ink/70 text-sm leading-relaxed whitespace-pre-line break-words">
        {expanded || !isLong ? text : `${text.slice(0, 240)}…`}
      </p>
      {isLong && (
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className="text-evergreen hover:text-evergreen-dark text-xs font-medium mt-1">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

export default CoverLetter;