import { QuickCommand, QuickCommandGroup, ProjectConfig } from '../types';
import { getEnabledProjects } from '../config';

const VARIABLE_PATTERN = /\{(\w+)\}/g;

export class QuickCommandDetector {
    constructor() {}

    getQuickCommands(): QuickCommandGroup[] {
        const projects = getEnabledProjects();

        if (projects.length === 0) {
            return [];
        }

        const groups: QuickCommandGroup[] = [];

        for (const project of projects) {
            if (!project.commands || project.commands.length === 0) {
                continue;
            }

            const quickCommands = project.commands.filter(cmd => {
                const variables = this.extractVariables(cmd.executeCommand);
                if (variables.length > 0) {
                    return false;
                }

                return true;
            });

            if (quickCommands.length > 0) {
                groups.push({
                    projectName: project.name,
                    project: project,
                    commands: quickCommands.map(cmd => ({
                        name: cmd.name,
                        executeCommand: cmd.executeCommand,
                        projectName: project.name,
                        project: project
                    }))
                });
            }
        }

        return groups;
    }

    private extractVariables(command: string): string[] {
        const matches = command.match(VARIABLE_PATTERN);
        if (!matches) {
            return [];
        }
        return matches.map(m => m.slice(1, -1));
    }

    hasVariables(command: string): boolean {
        return VARIABLE_PATTERN.test(command);
    }
}
