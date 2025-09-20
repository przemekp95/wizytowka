import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Project } from './entities/project.entity';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';

@Injectable()
export class ProjectService {
  private projects: Project[] = [
    {
      id: 'p1',
      title: 'Strona wizytówka',
      description: 'Personal website built with Next.js + NestJS',
      link: 'https://example.com',
      repo: 'https://github.com/user/wizytowka',
      tags: ['nextjs', 'nestjs', 'graphql'],
    },
  ];

  async findAll(): Promise<Project[]> {
    return this.projects;
  }

  async findOne(id: string): Promise<Project | null> {
    return this.projects.find((p) => p.id === id) ?? null;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const project: Project = { id: randomUUID(), ...input };
    this.projects.unshift(project);
    return project;
  }

  async update(input: UpdateProjectInput): Promise<Project> {
    const idx = this.projects.findIndex((p) => p.id === input.id);
    if (idx === -1) {
      throw new Error('Project not found');
    }
    this.projects[idx] = { ...this.projects[idx], ...input };
    return this.projects[idx];
  }

  async remove(id: string): Promise<string> {
    this.projects = this.projects.filter((p) => p.id !== id);
    return id;
  }
}
