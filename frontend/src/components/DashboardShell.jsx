import React, { useMemo, useRef, useState } from 'react';
import { Camera, Circle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

const DashboardShell = ({
  role,
  title,
  subtitle,
  accentClass = 'text-blue-300',
  activeTabClass = '',
  menuItems = [],
  activeMenuKey,
  onMenuSelect,
  children,
}) => {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';
  const avatarSrc = useMemo(() => {
    const avatar = String(user?.avatar || '').trim();
    if (!avatar) return '';
    if (avatar.startsWith('data:') || avatar.startsWith('http')) return avatar;
    return `${API_BASE_URL}${avatar}`;
  }, [API_BASE_URL, user?.avatar]);

  const initials = useMemo(() => {
    const fullName = String(user?.fullName || '').trim();
    if (!fullName) return 'U';
    const parts = fullName.split(/\s+/).filter(Boolean).slice(0, 2);
    const chars = parts.map((part) => part[0]?.toUpperCase()).join('');
    return chars || 'U';
  }, [user?.fullName]);
  const currentPlan = useMemo(() => {
    const normalized = String(user?.subscription || 'free').trim().toLowerCase();
    if (!normalized) return 'FREE';
    return normalized.toUpperCase();
  }, [user?.subscription]);

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

  const compressImageToDataUrl = async (file) => {
    const sourceDataUrl = await fileToDataUrl(file);
    const image = await new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('Could not load selected image'));
      nextImage.src = sourceDataUrl;
    });

    const maxSize = 256;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return sourceDataUrl;

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  };

  const handleSelectAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file.');
      event.target.value = '';
      return;
    }

    setAvatarBusy(true);
    setAvatarError('');
    try {
      const compressedAvatar = await compressImageToDataUrl(file);
      await updateProfile({ avatar: compressedAvatar });
    } catch {
      setAvatarError('Unable to update profile picture right now.');
    } finally {
      setAvatarBusy(false);
      event.target.value = '';
    }
  };

  const triggerAvatarPicker = () => {
    if (avatarBusy) return;
    fileInputRef.current?.click();
  };
  const activeHighlightClass = activeTabClass
    ? `${activeTabClass} border-transparent text-white`
    : theme === 'dark'
      ? 'bg-violet-500 border-violet-400 text-white'
      : 'bg-violet-500 border-violet-400 text-white';

  return (
    <div className="w-full lg:h-[calc(100vh-6rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 lg:h-full">
        <aside className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 min-h-[360px] lg:min-h-[calc(100vh-8rem)] lg:sticky lg:top-24 lg:self-start lg:overflow-hidden">
          <p className={`text-xs uppercase tracking-wide font-semibold ${accentClass}`}>{role} Menu</p>
          <nav className="mt-3 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon || Circle;
              const isActive = item.key === activeMenuKey;
              const content = (
                <>
                  <span className="inline-flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${item.iconClass || accentClass}`} />
                    {item.label}
                  </span>
                  <span className={`text-[11px] ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {item.badge || 'Menu'}
                  </span>
                </>
              );

              if (item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.target || '_self'}
                    rel={item.target === '_blank' ? 'noreferrer' : undefined}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition border-white/10 text-gray-200 hover:bg-white/10"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onMenuSelect?.(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition ${
                    isActive
                      ? activeHighlightClass
                      : 'border-white/10 text-gray-200 hover:bg-white/10'
                  }`}
                  aria-pressed={isActive}
                >
                  {content}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-2">
          <div className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                <p className="text-gray-300 mt-2">{subtitle}</p>
              </div>

              <div className="flex flex-col items-end">
                <span className={`mb-2 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold ${accentClass}`}>
                  Current Plan: {currentPlan}
                </span>
                <button
                  type="button"
                  onClick={triggerAvatarPicker}
                  disabled={avatarBusy}
                  className="group relative rounded-full border border-white/20 hover:border-white/40 transition disabled:opacity-60"
                  title="Edit profile picture"
                  aria-label="Edit profile picture"
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={`${user?.fullName || 'User'} profile`}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                      {initials}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/70 border border-white/30 text-white">
                    <Camera className="w-3.5 h-3.5" />
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelectAvatar}
                />
              </div>
            </div>
            {avatarError && <p className="text-sm text-red-300 mt-3">{avatarError}</p>}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
};

export default DashboardShell;
