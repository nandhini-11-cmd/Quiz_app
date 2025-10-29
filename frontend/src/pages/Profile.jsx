import { useEffect, useState } from "react";
import API from "../utils/axios";

export default function Profile() {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    avatar: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [preview, setPreview] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const avatars = Array.from({ length: 8 }).map(
    (_, i) => `/avatars/avatar${i + 1}.png`
  );

  // ✅ Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get("/users/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUserData(data);
        setSelectedAvatar(data.avatar || "/avatars/avatar1.png");

        const full =
          data.avatar?.startsWith("http") && data.avatar
            ? data.avatar
            : `${API_BASE}${data.avatar || "/avatars/avatar1.png"}`;
        setPreview(full);
      } catch (err) {
        console.error("Error loading profile:", err);
        alert("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ✅ File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imagePath = data.imagePath.startsWith("/uploads")
        ? data.imagePath
        : `/uploads/${data.imagePath.replace(/^public[\\/]+/, "")}`;

      setSelectedAvatar(imagePath);
      setPreview(`${API_BASE}${imagePath}`);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert(err.response?.data?.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Save profile updates
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.put(
        "/users/profile",
        {
          username: userData.username,
          email: userData.email,
          password: userData.password || undefined,
          avatar: selectedAvatar,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      localStorage.setItem("user", JSON.stringify(data));
      alert("Profile updated successfully!");
      setUserData({ ...data, password: "" });

      const updatedPreview =
        data.avatar?.startsWith("http") && data.avatar
          ? data.avatar
          : `${API_BASE}${data.avatar}`;
      setPreview(updatedPreview);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="text-center mt-10 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">
        My Profile
      </h2>

      <form onSubmit={handleUpdate} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block font-medium">Username</label>
          <input
            type="text"
            value={userData.username}
            onChange={(e) =>
              setUserData({ ...userData, username: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium">Email</label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) =>
              setUserData({ ...userData, email: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block font-medium">Change Password</label>
          <input
            type="password"
            placeholder="Enter new password (optional)"
            value={userData.password}
            onChange={(e) =>
              setUserData({ ...userData, password: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Upload Photo */}
        <div className="mt-4">
          <label className="block font-medium mb-2">Upload Your Photo</label>

          <div className="flex items-center space-x-4">
            <input
              id="fileInput"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />

            <label
              htmlFor="fileInput"
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              {uploading ? "Uploading..." : "Choose Photo"}
            </label>

            {preview && (
              <div className="flex items-center space-x-2">
                <img
                  src={preview}
                  alt="preview"
                  className="w-16 h-16 rounded-full border"
                />
                <span className="text-gray-600 text-sm">Preview</span>
              </div>
            )}
          </div>
        </div>

        {/* Avatar Grid */}
        <div>
          <label className="block font-medium mb-2">Choose Avatar</label>
          <div className="grid grid-cols-4 gap-2">
            {avatars.map((src) => {
              const full = `${API_BASE}${src}`;
              return (
                <img
                  key={src}
                  src={full}
                  alt="avatar"
                  className={`w-16 h-16 rounded-full cursor-pointer border-4 ${
                    selectedAvatar === src
                      ? "border-blue-500"
                      : "border-transparent"
                  }`}
                  onClick={() => {
                    setSelectedAvatar(src);
                    setPreview(full);
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
