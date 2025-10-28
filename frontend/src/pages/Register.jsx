import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import API from "../utils/axios";
import { useNavigate } from "react-router-dom";

export default function Register({ setUser = () => {} }) {
  const navigate = useNavigate();

 
  const [selectedAvatar, setSelectedAvatar] = useState("/avatars/avatar1.png");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("http://localhost:5000/avatars/avatar1.png");

  const avatars = Array.from({ length: 8 }).map((_, i) => `/avatars/avatar${i + 1}.png`);

  const validationSchema = Yup.object({
    username: Yup.string().required("Username is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().min(6, "At least 6 characters").required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    role: Yup.string().required("Select a role"),
  });

  
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

     
      setSelectedAvatar(data.imagePath);
      setPreview(`http://localhost:5000${data.imagePath}`);
    } catch (err) {
      alert(err.response?.data?.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const { data } = await API.post("/users/register", {
        ...values,
        avatar: selectedAvatar, 
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data); 
      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
      resetForm();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Register</h2>

      <Formik
        initialValues={{ username: "", email: "", password: "", confirmPassword: "", role: "student" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            
            <div>
              <label className="block mb-1">Username</label>
              <Field name="username" className="w-full p-2 border rounded" />
              <ErrorMessage name="username" component="div" className="text-red-500 text-sm" />
            </div>

            
            <div>
              <label className="block mb-1">Email</label>
              <Field name="email" type="email" className="w-full p-2 border rounded" />
              <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
            </div>

           
            <div>
              <label className="block mb-1">Password</label>
              <Field name="password" type="password" autoComplete="new-password" className="w-full p-2 border rounded" />
              <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
            </div>

            
            <div>
              <label className="block mb-1">Confirm Password</label>
              <Field name="confirmPassword" type="password" autoComplete="new-password" className="w-full p-2 border rounded" />
              <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm" />
            </div>

           
            <div>
              <label className="block mb-1">Role</label>
              <Field as="select" name="role" className="w-full p-2 border rounded">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </Field>
              <ErrorMessage name="role" component="div" className="text-red-500 text-sm" />
            </div>
            
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
        <img src={preview} alt="preview" className="w-16 h-16 rounded-full border" />
        <span className="text-gray-600 text-sm">Preview</span>
      </div>
    )}
  </div>
</div>

           
            <div>
              <label className="block mb-2 font-medium"> or Choose Avatar</label>
              <div className="grid grid-cols-4 gap-2">
                {avatars.map((src) => {
                  const full = `http://localhost:5000${src}`;
                  return (
                    <img
                      key={src}
                      src={full}
                      alt="avatar"
                      className={`w-16 h-16 rounded-full cursor-pointer border-4 ${
                        selectedAvatar === src ? "border-blue-500" : "border-transparent"
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

            

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mt-4"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}