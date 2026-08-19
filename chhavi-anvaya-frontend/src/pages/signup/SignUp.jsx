import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { signUp } from "../../services/authService";
import styles from "./SignUp.module.css";

const validationSchema = Yup.object({
  username: Yup.string().min(3, "Username must be at least 3 characters").required("Username is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  mobile: Yup.string().matches(/^[0-9]{10}$/, "Invalid phone number").required("Mobile number is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  fullName: Yup.string().required("Full name is required"),
});

function SignUp() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      mobile: "",
      password: "",
      fullName: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await signUp(values);
        if (response.success) {
          toast.success("Viewer account created. Sign in to watch.");
          navigate("/");
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Sign up failed.");
      }
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <p className={styles.kicker}>Consumer signup</p>
        <h1>Watch, search, rate</h1>
        <p className={styles.lead}>
          Viewer accounts can browse and play clips. Uploading is reserved for enrolled creators.
        </p>
        <form onSubmit={formik.handleSubmit}>
          {["email", "mobile", "password", "fullName", "username"].map((field) => (
            <div key={field}>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                name={field}
                placeholder={
                  field === "fullName"
                    ? "Full name"
                    : field === "mobile"
                    ? "Mobile number"
                    : field[0].toUpperCase() + field.slice(1)
                }
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values[field]}
              />
              {formik.touched[field] && formik.errors[field] && (
                <div className="error-message">{formik.errors[field]}</div>
              )}
            </div>
          ))}
          <button type="submit" disabled={formik.isSubmitting}>
            Create viewer account
          </button>
        </form>
        <p className={styles.redirect}>
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
