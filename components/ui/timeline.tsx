"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Timeline = React.forwardRef<HTMLOListElement, React.ComponentProps<"ol">>(({ className, ...props }, ref) => (
  <ol ref={ref} className={cn("relative border-l border-gray-200", className)} {...props} />
))
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("mb-10 ml-6", className)} {...props} />
))
TimelineItem.displayName = "TimelineItem"

const TimelineConnector = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white",
        className,
      )}
      {...props}
    />
  ),
)
TimelineConnector.displayName = "TimelineConnector"

const TimelineHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center mb-1", className)} {...props} />
))
TimelineHeader.displayName = "TimelineHeader"

const TimelineTitle = React.forwardRef<HTMLHeadingElement, React.ComponentProps<"h3">>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold text-gray-900", className)} {...props} />
  ),
)
TimelineTitle.displayName = "TimelineTitle"

const TimelineIcon = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white",
        className,
      )}
      {...props}
    >
      <div className="w-3 h-3 text-blue-800">{children}</div>
    </div>
  ),
)
TimelineIcon.displayName = "TimelineIcon"

const TimelineDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("mb-4 text-base font-normal text-gray-500", className)} {...props} />
  ),
)
TimelineDescription.displayName = "TimelineDescription"

const TimelineContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />,
)
TimelineContent.displayName = "TimelineContent"

export {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineTitle,
  TimelineIcon,
  TimelineDescription,
  TimelineContent,
}
