package com.tournament.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(nullable = false)
    private String captain;

    @Column(name = "matches_played")
    private int matchesPlayed;

    private int wins;
    private int losses;
    private int points;

    // Constructors
    public Team() {}

    public Team(String teamName, String captain) {
        this.teamName = teamName;
        this.captain = captain;
        this.matchesPlayed = 0;
        this.wins = 0;
        this.losses = 0;
        this.points = 0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getCaptain() { return captain; }
    public void setCaptain(String captain) { this.captain = captain; }

    public int getMatchesPlayed() { return matchesPlayed; }
    public void setMatchesPlayed(int matchesPlayed) { this.matchesPlayed = matchesPlayed; }

    public int getWins() { return wins; }
    public void setWins(int wins) { this.wins = wins; }

    public int getLosses() { return losses; }
    public void setLosses(int losses) { this.losses = losses; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    @Override
    public String toString() {
        return "Team{id=" + id + ", teamName='" + teamName + "', captain='" + captain + 
               "', matchesPlayed=" + matchesPlayed + ", wins=" + wins + ", losses=" + losses + ", points=" + points + "}";
    }
}
