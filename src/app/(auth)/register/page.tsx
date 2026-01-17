import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Inscription"
            subtitle="Rejoignez la communauté BetaGraph"
        >
            <SignUpForm />
        </AuthLayout>
    );
}
