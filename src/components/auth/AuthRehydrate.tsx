"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { setCredentials, setRehydrated, loadStoredAuth } from "@/redux/api/auth";

/**
 * Runs once on client mount: restores auth from localStorage and marks rehydration done.
 * Prevents redirect-to-login until we've had a chance to restore the session.
 */
export function AuthRehydrate() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      dispatch(setCredentials(stored));
    }
    dispatch(setRehydrated());
  }, [dispatch]);

  return null;
}
