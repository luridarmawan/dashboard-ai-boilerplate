import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title={"Sign Up -" + import.meta.env.VITE_APP_NAME}
        description={import.meta.env.VITE_APP_DESCRIPTION}
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
