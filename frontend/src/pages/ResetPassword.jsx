import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import API from "../utils/axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Please confirm your password"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { data } = await API.post(`/users/reset-password/${token}`, {
        password: values.password,
      });
      alert(data.message || "Password reset successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Error resetting password");
    } finally {
      setSubmitting(false);
    }
  };
  console.log("Reset token:", useParams());

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
        Reset Password
      </h2>
      <Formik
        initialValues={{ password: "", confirmPassword: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label>New Password</label>
              <Field
                name="password"
                type="password"
                className="w-full p-2 border rounded"
                placeholder="Enter new password"
              />
              <ErrorMessage
                name="password"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <label>Confirm Password</label>
              <Field
                name="confirmPassword"
                type="password"
                className="w-full p-2 border rounded"
                placeholder="Re-enter password"
              />
              <ErrorMessage
                name="confirmPassword"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <button
  type="submit"
  disabled={isSubmitting}
  className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
>
  {isSubmitting ? "Resetting..." : "Reset Password"}
</button>
<p className="text-gray-500 text-sm text-center mt-2">
  You’ll be redirected to login after successful reset.
</p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
