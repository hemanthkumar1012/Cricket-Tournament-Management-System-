package com.tournament.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team1_id", nullable = false)
    private Team team1;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team2_id", nullable = false)
    private Team team2;

    @Column(name = "team1_score")
    private int team1Score;

    @Column(name = "team2_score")
    private int team2Score;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private Team winner;

    @Column(nullable = false)
    private String status; // "SCHEDULED", "COMPLETED"

    // Constructors
    public Match() {}

    public Match(Team team1, Team team2, String status) {
        this.team1 = team1;
        this.team2 = team2;
        this.status = status;
        this.team1Score = 0;
        this.team2Score = 0;
        this.winner = null;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Team getTeam1() { return team1; }
    public void setTeam1(Team team1) { this.team1 = team1; }

    public Team getTeam2() { return team2; }
    public void setTeam2(Team team2) { this.team2 = team2; }

    public int getTeam1Score() { return team1Score; }
    public void setTeam1Score(int team1Score) { this.team1Score = team1Score; }

    public int getTeam2Score() { return team2Score; }
    public void setTeam2Score(int team2Score) { this.team2Score = team2Score; }

    public Team getWinner() { return winner; }
    public void setWinner(Team winner) { this.winner = winner; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return "Match{id=" + id + ", team1=" + (team1 != null ? team1.getTeamName() : "null") + 
               ", team2=" + (team2 != null ? team2.getTeamName() : "null") + ", team1Score=" + team1Score + 
               ", team2Score=" + team2Score + ", winner=" + (winner != null ? winner.getTeamName() : "null") + 
               ", status='" + status + "'}";
    }
}
