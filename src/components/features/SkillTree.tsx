
import React from 'react';
import { UserStats, SkillType } from '@/types';
import { BookOpen, PenTool, Lightbulb, HelpCircle, GraduationCap } from 'lucide-react';

interface SkillTreeProps {
    stats: UserStats;
}

const SKILL_CONFIG = {
    'Questioner': { icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-100', bar: 'bg-orange-500' },
    'Clarifier': { icon: Lightbulb, color: 'text-blue-600', bg: 'bg-blue-100', bar: 'bg-blue-500' },
    'Summarizer': { icon: PenTool, color: 'text-green-600', bg: 'bg-green-100', bar: 'bg-green-500' },
    'Predictor': { icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100', bar: 'bg-purple-500' },
    'DeepReader': { icon: GraduationCap, color: 'text-stone-600', bg: 'bg-stone-100', bar: 'bg-stone-500' }
};

export function SkillTree({ stats }: SkillTreeProps) {
    // Determine max XP for current level to show progress
    const getProgress = (xp: number, level: number) => {
        const xpForCurrentLevel = (level - 1) * 100;
        const xpForNextLevel = level * 100;
        const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
        return Math.min(100, Math.max(0, progress));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.keys(stats.skills) as SkillType[]).map((skillKey) => {
                const skill = stats.skills[skillKey];
                const config = SKILL_CONFIG[skillKey] || SKILL_CONFIG['DeepReader'];
                const Icon = config.icon;
                const progress = getProgress(skill.xp, skill.level);

                return (
                    <div key={skillKey} className="bg-white border-2 border-stone-200 rounded-xl p-6 relative overflow-hidden group hover:border-stone-400 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-xl ${config.bg} ${config.color} flex items-center justify-center shadow-sm`}>
                                <Icon size={24} />
                            </div>
                            <div className="text-right">
                                <span className="block text-3xl font-bold text-stone-800 tabular-nums">
                                    Level {skill.level}
                                </span>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                    {skillKey}
                                </span>
                            </div>
                        </div>

                        <div className="mb-2">
                            <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                                <span>{skill.xp} XP</span>
                                <span>{skill.level * 100} XP (Next)</span>
                            </div>
                            <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${config.bar} transition-all duration-1000 ease-out`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                            <span className="text-xs text-stone-400 font-serif italic">
                                Total Actions: {skill.actions}
                            </span>
                            {/* Badge Placeholder */}
                            {skill.level >= 5 && (
                                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold border border-yellow-200">
                                    MASTER
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
