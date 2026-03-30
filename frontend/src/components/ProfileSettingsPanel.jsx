import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import LocalStorageService from '../services/localStorageService';
import { portfolioApi } from '../services/portfolioApi';
import { resolveMediaUrl } from '../utils/api';

const ProfileSettingsPanel = ({ accent, onPortfolioDeleted }) => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { showSuccess, showError, confirm } = useModal();
  const navigate = useNavigate();
  const [nameDraft, setNameDraft] = useState(String(user?.fullName || ''));
  const [bioDraft, setBioDraft] = useState(String(user?.bio || ''));
  const [busy, setBusy] = useState(false);
  const [pictureBusy, setPictureBusy] = useState(false);
  const [portfolioBusy, setPortfolioBusy] = useState(false);

  const avatarSrc = useMemo(() => {
    const avatar = String(user?.avatar || '').trim();
    if (!avatar) return '';
    return resolveMediaUrl(avatar);
  }, [user?.avatar]);

  useEffect(() => {
    setNameDraft(String(user?.fullName || ''));
    setBioDraft(String(user?.bio || ''));
  }, [user?.fullName, user?.bio]);

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

  const saveProfileDetails = async () => {
    const fullName = String(nameDraft || '').trim();
    const bio = String(bioDraft || '').trim();
    if (!fullName) {
      showError('Validation Error', 'Name cannot be empty.');
      return;
    }
    try {
      setBusy(true);
      await updateProfile({ fullName, bio });
      showSuccess('Profile Updated', 'Your profile details were saved.');
    } catch (error) {
      showError('Update Failed', error?.message || 'Unable to save profile details right now.');
    } finally {
      setBusy(false);
    }
  };

  const handlePictureChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) {
      showError('Invalid File', 'Please select an image file.');
      event.target.value = '';
      return;
    }
    try {
      setPictureBusy(true);
      const compressedAvatar = await compressImageToDataUrl(file);
      await updateProfile({ avatar: compressedAvatar });
      showSuccess('Profile Updated', 'Profile picture updated successfully.');
    } catch (error) {
      showError('Upload Failed', error?.message || 'Unable to upload profile picture right now.');
    } finally {
      setPictureBusy(false);
      event.target.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    const approved = await confirm({
      type: 'warning',
      title: 'Delete Account?',
      message: 'This permanently deletes your account and related data. This cannot be undone.',
      confirmText: 'Yes, Delete',
      cancelText: 'No',
      confirmDelaySeconds: 5,
    });
    if (!approved) return;

    try {
      setBusy(true);
      await deleteAccount();
      showSuccess('Account Deleted', 'Your account has been deleted.');
      navigate('/login', { replace: true });
    } catch (error) {
      showError('Delete Failed', error?.message || 'Unable to delete account right now.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePortfolio = async () => {
    const approved = await confirm({
      type: 'warning',
      title: 'Delete Portfolio?',
      message: 'Are you sure you want to delete your portfolio?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!approved) return;

    const token = LocalStorageService.getToken();
    if (!token) {
      showError('Delete Failed', 'Authentication is required.');
      return;
    }

    try {
      setPortfolioBusy(true);
      await portfolioApi.deleteMine(token);
      if (typeof onPortfolioDeleted === 'function') {
        onPortfolioDeleted();
      }
      showSuccess('Portfolio Deleted', 'Your portfolio was deleted successfully.');
    } catch (error) {
      showError('Delete Failed', error?.message || 'Unable to delete portfolio right now.');
    } finally {
      setPortfolioBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Profile Details</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            type="text"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder="Full name"
            className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <label className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white cursor-pointer">
            {pictureBusy ? 'Uploading picture...' : 'Change Profile Picture'}
            <input
              type="file"
              accept="image/*"
              onChange={handlePictureChange}
              className="hidden"
              disabled={pictureBusy}
            />
          </label>
        </div>
        <textarea
          value={bioDraft}
          onChange={(event) => setBioDraft(event.target.value)}
          rows={5}
          placeholder="Write your bio"
          className="mt-3 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={saveProfileDetails}
          disabled={busy}
          className={`mt-3 px-4 py-2 rounded-lg text-white ${accent?.primaryButtonClass || 'bg-blue-600 hover:bg-blue-500'}`}
        >
          {busy ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-red-500/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-red-200 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-300 mb-4">Delete your portfolio or account permanently.</p>
        {avatarSrc && (
          <img src={avatarSrc} alt="Current profile" className="w-16 h-16 rounded-full object-cover mb-4 border border-white/20" />
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDeletePortfolio}
            disabled={portfolioBusy}
            className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-400 transition"
          >
            {portfolioBusy ? 'Processing...' : 'Delete Portfolio'}
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-500 transition"
          >
            {busy ? 'Processing...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPanel;
