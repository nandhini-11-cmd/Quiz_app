import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import API from "../utils/axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email")
      .required("Email is required"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const { data } = await API.post("/users/forgot-password", values);
      alert(data.message || "Password reset link sent to your email!");
      resetForm();
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Error sending email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
        Forgot Password
      </h2>
      <p className="text-center text-gray-600 mb-6">
        Enter your registered email, and we’ll send you a reset link.
      </p>

      <Formik
        initialValues={{ email: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label>Email</label>
              <Field
                name="email"
                type="email"
                className="w-full p-2 border rounded"
                placeholder="Enter your email"
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
