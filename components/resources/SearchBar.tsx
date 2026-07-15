"use client";

import { LearningResource } from "@/lib/resources";
import ResourceCard from "./ResourceCard";

interface Props {
  resources: LearningResource[];
}

export default function SearchBar({ resources }: Props) {
  if (resources.length === 0) {
    return (
        <div className="rounded-2xl border border-[#2A2A31] bg-[#16161A] p-16 text-center">
          <h2 className="text-xl font-semibold text-zinc-100">No resources found</h2>
        <p className="mt-3 text-zinc-400">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
        />
      ))}
    </div>
  );
}