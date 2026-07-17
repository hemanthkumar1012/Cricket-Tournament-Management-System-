package com.tournament.service;

import com.tournament.entity.Team;
import com.tournament.repository.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TeamService {

    private final TeamRepository teamRepository;

    @Autowired
    public TeamService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    public Team addTeam(Team team) {
        team.setMatchesPlayed(0);
        team.setWins(0);
        team.setLosses(0);
        team.setPoints(0);
        return teamRepository.save(team);
    }

    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    public List<Team> getStandings() {
        return teamRepository.findAll().stream()
                .sorted((t1, t2) -> {
                    int ptsCompare = Integer.compare(t2.getPoints(), t1.getPoints());
                    if (ptsCompare != 0) return ptsCompare;
                    return Integer.compare(t2.getWins(), t1.getWins());
                })
                .toList();
    }
}
