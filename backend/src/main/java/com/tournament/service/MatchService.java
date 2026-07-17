package com.tournament.service;

import com.tournament.entity.Match;
import com.tournament.entity.Team;
import com.tournament.repository.MatchRepository;
import com.tournament.repository.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class MatchService {

    private final MatchRepository matchRepository;
    private final TeamRepository teamRepository;

    @Autowired
    public MatchService(MatchRepository matchRepository, TeamRepository teamRepository) {
        this.matchRepository = matchRepository;
        this.teamRepository = teamRepository;
    }

    public Match createMatch(Match match) {
        Team t1 = teamRepository.findById(match.getTeam1().getId())
                .orElseThrow(() -> new IllegalArgumentException("Team 1 not found"));
        Team t2 = teamRepository.findById(match.getTeam2().getId())
                .orElseThrow(() -> new IllegalArgumentException("Team 2 not found"));
        
        match.setTeam1(t1);
        match.setTeam2(t2);
        match.setStatus("SCHEDULED");
        match.setTeam1Score(0);
        match.setTeam2Score(0);
        match.setWinner(null);
        return matchRepository.save(match);
    }

    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    @Transactional
    public Match updateMatchResult(Long matchId, int team1Score, int team2Score) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        if ("COMPLETED".equals(match.getStatus())) {
            throw new IllegalStateException("Match is already completed");
        }

        match.setTeam1Score(team1Score);
        match.setTeam2Score(team2Score);
        match.setStatus("COMPLETED");

        Team t1 = match.getTeam1();
        Team t2 = match.getTeam2();

        t1.setMatchesPlayed(t1.getMatchesPlayed() + 1);
        t2.setMatchesPlayed(t2.getMatchesPlayed() + 1);

        if (team1Score > team2Score) {
            match.setWinner(t1);
            t1.setWins(t1.getWins() + 1);
            t1.setPoints(t1.getPoints() + 2);
            t2.setLosses(t2.getLosses() + 1);
        } else if (team2Score > team1Score) {
            match.setWinner(t2);
            t2.setWins(t2.getWins() + 1);
            t2.setPoints(t2.getPoints() + 2);
            t1.setLosses(t1.getLosses() + 1);
        } else {
            match.setWinner(null);
            t1.setPoints(t1.getPoints() + 1);
            t2.setPoints(t2.getPoints() + 1);
        }

        teamRepository.save(t1);
        teamRepository.save(t2);
        return matchRepository.save(match);
    }
}
