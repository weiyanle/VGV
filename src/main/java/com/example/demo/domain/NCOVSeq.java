package com.example.demo.domain;

import java.util.Date;

public class NCOVSeq {
    private String strain;
    private String virus;
    private String gisaid_epi_isl;
    private String genbank_accession;
    private Date date;
    private String region;
    private String country;
    private String division;
    private String location;
    private String region_exposure;
    private String country_exposure;
    private String division_exposure;
    private String segment;
    private String length;
    private String host;
    private String age;
    private String sex;
    private String nextstrain_clade;
    private String pango_lineage;
    private String gisaid_clade;
    private String originating_lab;
    private String submitting_lab;
    private String authors;
    private String url;
    private String title;
    private String paper_url;
    private Date date_submitted;
    private String purpose_of_sequencing;
    private String variant;
    private String sequence;
    private String vgv_number;

    public String getStrain() {
        return strain;
    }

    public String getVirus() {
        return virus;
    }

    public String getGisaid_epi_isl() {
        return gisaid_epi_isl;
    }

    public String getGenbank_accession() {
        return genbank_accession;
    }

    public Date getDate() {
        return date;
    }

    public String getRegion() {
        return region;
    }

    public String getCountry() {
        return country;
    }

    public String getDivision() {
        return division;
    }

    public String getLocation() {
        return location;
    }

    public String getRegion_exposure() {
        return region_exposure;
    }

    public String getCountry_exposure() {
        return country_exposure;
    }

    public String getDivision_exposure() {
        return division_exposure;
    }

    public String getSegment() {
        return segment;
    }

    public String getLength() {
        return length;
    }

    public String getHost() {
        return host;
    }

    public String getAge() {
        return age;
    }

    public String getSex() {
        return sex;
    }

    public String getNextstrain_clade() {
        return nextstrain_clade;
    }

    public String getPango_lineage() {
        return pango_lineage;
    }

    public String getGisaid_clade() {
        return gisaid_clade;
    }

    public String getOriginating_lab() {
        return originating_lab;
    }

    public String getSubmitting_lab() {
        return submitting_lab;
    }

    public String getAuthors() {
        return authors;
    }

    public String getUrl() {
        return url;
    }

    public String getTitle() {
        return title;
    }

    public String getPaper_url() {
        return paper_url;
    }

    public Date getDate_submitted() {
        return date_submitted;
    }

    public String getPurpose_of_sequencing() {
        return purpose_of_sequencing;
    }

    public String getVariant() {
        return variant;
    }

    public String getSequence() {
        return sequence;
    }

    public String getVgv_number() {
        return vgv_number;
    }

    @Override
    public String toString(){
        return strain+" "+sequence;
    }
}
