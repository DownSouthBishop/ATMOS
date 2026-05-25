type TagVariant = 'gold' | 'teal' | 'green' | 'amber' | 'muted' | 'red';

interface TagProps {
  variant?: TagVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Tag({ variant = 'teal', children, className = '' }: TagProps) {
  return (
    <span className={`tag tag-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}
