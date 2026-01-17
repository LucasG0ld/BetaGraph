import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { SignInForm } from "@/features/auth/components/SignInForm";

export default function LoginPage() {
    return (
        <AuthLayout title="Connexion" subtitle="Accédez à votre espace BetaGraph">
            <SignInForm />
        </AuthLayout>
    );
}
