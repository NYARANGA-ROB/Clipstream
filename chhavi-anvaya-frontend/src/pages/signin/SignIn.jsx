import { useContext } from "react";
import { toast } from "react-toastify";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../../context/AuthContext";
import { signIn } from "../../services/authService";
import Loader from "../../components/Loader/Loader";
import styles from "./SignIn.module.css";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

function SignIn() {
  const { user, loading, setAuthUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await signIn(values);
        if (response.success) {
          setAuthUser(response.user);
          navigate("/", { replace: true });
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Sign in failed.");
      }
    },
  });

  if (loading) return <Loader />;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <p className={styles.kicker}>Clipstream</p>
        <h1>Drop in and watch</h1>
        <form onSubmit={formik.handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
          />
          {formik.touched.email && formik.errors.email && (
            <div className="error-message">{formik.errors.email}</div>
          )}
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
          />
          {formik.touched.password && formik.errors.password && (
            <div className="error-message">{formik.errors.password}</div>
          )}
          <button type="submit" disabled={formik.isSubmitting}>
            Sign in
          </button>
        </form>
        <p className={styles.redirect}>
          New viewer? <Link to="/signUp">Create a consumer account</Link>
        </p>
        <p className={styles.hint}>
          Or <Link to="/">browse the feed</Link> without signing in. Creator accounts are enrolled privately.
        </p>
      </div>
    </div>
  );
}

export default SignIn;
