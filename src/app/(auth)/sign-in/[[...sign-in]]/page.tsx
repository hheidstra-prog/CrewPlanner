import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      signUpUrl={undefined}
      appearance={{
        elements: {
          footerAction: { display: "none" },
        },
      }}
    />
  );
}
