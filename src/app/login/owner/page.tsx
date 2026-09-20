import LoginForm from "../LoginForm";

export default function OwnerLoginPage() {
  return <LoginForm
    role="OWNER"
    title="Owner Login"
    description="Sign in to manage your maktab, teachers, students, classes, and fees."
    demoEmail="owner@maktab.local"
  />;
}