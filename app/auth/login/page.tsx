"use client";

import Image from "next/image";
import { LoginForm } from "@/features/auth/LoginForm";
import loginImg from "@/assets/login.jpg";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
    

      <div className="relative hidden flex-1 lg:block lg:w-1/2">
        <Image
          src={loginImg}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
      </div>
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full lg:max-w-md xl:max-w-xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
