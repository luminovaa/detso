"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 z-[100] flex max-h-screen w-full flex-col gap-3 p-4 sm:bottom-4 sm:right-4 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center space-x-4 overflow-hidden rounded-3xl border p-6 pr-10 shadow-2xl backdrop-blur-md transition-all duration-500 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 hover:scale-[1.02] hover:shadow-xl",
  {
    variants: {
      variant: {
        default: "border-slate-200/50 bg-white/80 text-slate-900 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100",
        success: "border-green-200/50 bg-gradient-to-r from-green-50/90 to-emerald-50/90 text-green-900 dark:border-green-700/50 dark:from-green-950/90 dark:to-emerald-950/90 dark:text-green-100",
        error: "border-red-200/50 bg-gradient-to-r from-red-50/90 to-rose-50/90 text-red-900 dark:border-red-700/50 dark:from-red-950/90 dark:to-rose-950/90 dark:text-red-100",
        warning: "border-yellow-200/50 bg-gradient-to-r from-yellow-50/90 to-amber-50/90 text-yellow-900 dark:border-yellow-700/50 dark:from-yellow-950/90 dark:to-amber-950/90 dark:text-yellow-100",
        info: "border-blue-200/50 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 text-blue-900 dark:border-blue-700/50 dark:from-blue-950/90 dark:to-cyan-950/90 dark:text-blue-100",
        destructive: "border-red-200/50 bg-gradient-to-r from-red-50/90 to-rose-50/90 text-red-900 dark:border-red-700/50 dark:from-red-950/90 dark:to-rose-950/90 dark:text-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-9 shrink-0 items-center justify-center rounded-2xl border bg-transparent px-4 text-sm font-medium ring-offset-background transition-all duration-300 hover:bg-secondary/50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-full p-2 text-foreground/50 opacity-70 transition-all duration-300 hover:text-foreground hover:opacity-100 hover:bg-black/5 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:hover:bg-red-500/20 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 dark:hover:bg-white/10",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-80 leading-relaxed mt-1", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

// Enhanced Toast Icon Component
const ToastIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: VariantProps<typeof toastVariants>["variant"]
  }
>(({ className, variant, ...props }, ref) => {
  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    destructive: AlertCircle,
    default: Info,
  }

  const Icon = iconMap[variant || "default"]

  const iconColorMap = {
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    info: "text-blue-600 dark:text-blue-400",
    destructive: "text-red-600 dark:text-red-400",
    default: "text-slate-600 dark:text-slate-400",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full p-1.5 animate-in zoom-in-50 duration-300",
        iconColorMap[variant || "default"],
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5" />
    </div>
  )
})
ToastIcon.displayName = "ToastIcon"

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
}