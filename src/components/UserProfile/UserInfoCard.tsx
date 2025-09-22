import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useState, useEffect } from "react";
import { xfetch, setXFetchContext } from "../../services";
import { useClient } from "../../context/ClientContext";

export default function UserInfoCard() {
  const { selectedClient } = useClient();
  const { isOpen, openModal, closeModal } = useModal();
  const { user, token, updateUser } = useAuth();
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    description: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        description: user.description || ''
      });
    }
    if (selectedClient && token) {
      setXFetchContext({
        token,
        selectedClient,
      });
    }
  }, [user, selectedClient, token]);

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;
      const response = await xfetch(`${API_BASE_URL}/user/${user?.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          description: formData.description
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t('profile.updateSuccess'));
        // Update the user context with the new data
        const updatedUserData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          description: formData.description
        };

        // Update user data in context
        updateUser(updatedUserData);

        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setError(data.message || t('profile.updateError'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="p-5 dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="">
          <h4 className="hide text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            {t('profile.personalInformation')}
          </h4>

          <div id="user-metadata" className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-7 2xl:gap-x-32">
            {/* Kolom Foto Profil */}
            <div className="flex justify-center">
              <img
                src={user?.avatar || "/images/user/default.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border border-gray-300 dark:border-gray-700"
              />
            </div>

            {/* Kolom-kolom metadata user */}
            <div className="col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t('profile.firstName')}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.firstName || 'User'}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t('profile.lastName')}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.lastName || ''}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t('profile.emailAddress')}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.email || ''}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t('profile.phone')}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.phone || ''}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t('profile.bio')}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.description || ''}
                </p>
              </div>
            </div>
          </div>



        </div>

        <button
          onClick={openModal}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          {t('profile.edit')}
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[900px] flex flex-col">
        <div className="user-info-modal-container flex flex-col h-full overflow-hidden p-4 lg:p-6">
          <div className="px-2 pr-14 flex-shrink-0">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {t('profile.editPersonalInformation')}
            </h4>
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {t('profile.updateDetails')}
            </p>
          </div>
          <form className="flex flex-col flex-1 min-h-0">
            <div className="custom-scrollbar flex-1 overflow-y-auto px-2 pb-3 min-h-0">
              {/* socal link di form bagian "Personal Information" */}
              <div className="hidden">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Social Links
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      type="text"
                      value="https://www.facebook.com/luridarmawan"
                    />
                  </div>

                  <div>
                    <Label>X.com</Label>
                    <Input type="text" value="https://x.com/luridarmawan" />
                  </div>

                  <div>
                    <Label>Linkedin</Label>
                    <Input
                      type="text"
                      value="https://www.linkedin.com/"
                    />
                  </div>

                  <div>
                    <Label>Instagram</Label>
                    <Input type="text" value="https://instagram.com/luridarmawan" />
                  </div>
                </div>
              </div>
              <div className="">
                <h5 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                      type="text"
                      name="email"
                      value={formData.email}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-4 px-2 py-2 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 px-2 py-2 bg-green-100 text-green-700 rounded-md">
                {success}
              </div>
            )}
            <div className="flex items-center gap-3 px-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 lg:justify-end flex-shrink-0">
              <Button size="sm" variant="outline" onClick={closeModal} disabled={isLoading}>
                {t('profile.close')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isLoading}>
                {isLoading ? t('profile.saving') : t('profile.saveChanges')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
