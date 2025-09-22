import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title={"Sign In - " + import.meta.env.VITE_APP_NAME}
        description={import.meta.env.VITE_APP_DESCRIPTION}
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
