import LoginForm from "../LoginForm";

export default function TeacherLoginPage() {
  return <LoginForm
    role="TEACHER"
    title="Teacher Login"
    description="Sign in to manage your assigned classes and students."
    demoEmail="teacher1@maktab.local"
  />;
}