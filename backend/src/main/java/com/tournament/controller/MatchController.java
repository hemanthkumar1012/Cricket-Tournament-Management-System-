package com.tournament.controller;

import com.tournament.entity.Match;
import com.tournament.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "*")
public class MatchController {

    private final MatchService matchService;

    @Autowired
    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @PostMapping
    public Match createMatch(@RequestBody Match match) {
        return matchService.createMatch(match);
    }

    @GetMapping
    public List<Match> getAllMatches() {
        return matchService.getAllMatches();
    }

    @PutMapping("/{id}/result")
    public Match updateMatchResult(
            @PathVariable Long id,
            @RequestParam int team1Score,
            @RequestParam int team2Score) {
        return matchService.updateMatchResult(id, team1Score, team2Score);
    }
}
