import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Project } from './entities/project.entity';
import { ProjectService } from './project.service';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';

@Resolver(() => Project)
export class ProjectResolver {
  constructor(private readonly service: ProjectService) {}

  @Query(() => [Project], { name: 'projects' })
  projects(): Project[] {
    return this.service.findAll();
  }

  @Query(() => Project, { name: 'project', nullable: true })
  project(@Args('id', { type: () => ID }) id: string): Project | undefined {
    return this.service.findOne(id);
  }

  @Mutation(() => Project)
  createProject(@Args('input') input: CreateProjectInput): Project {
    return this.service.create(input);
  }

  @Mutation(() => Project)
  updateProject(@Args('input') input: UpdateProjectInput): Project {
    return this.service.update(input);
  }

  @Mutation(() => ID)
  removeProject(@Args('id', { type: () => ID }) id: string): string {
    return this.service.remove(id);
  }
}
