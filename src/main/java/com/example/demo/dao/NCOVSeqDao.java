package com.example.demo.dao;
import com.example.demo.domain.NCOVSeq;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Select;
import org.springframework.stereotype.Repository;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Repository
public interface NCOVSeqDao {
    @Select("select * from ncov_global where strain=#{strain}")
    public NCOVSeq getOneByStrain(String strain);

    @Select("select * from ncov_global limit 1000")
    public List<NCOVSeq> getALL();

    @Select("select * from ncov_global where nextstrain_clade=#{clade} and sequence!='?' limit 10")
    public List<NCOVSeq> getByClade(String clade);

    @Select("select strain,virus,gisaid_epi_isl,genbank_accession,date,region,country,division,location,region_exposure,country_exposure,division_exposure,segment,length,host,age,sex,nextstrain_clade,pango_lineage,gisaid_clade,originating_lab,submitting_lab,authors,url,title,paper_url,date_submitted,purpose_of_sequencing,variant,vgv_number from ncov_global")
    public List<NCOVSeq> getAllButSeq();

    public List<NCOVSeq> getBySomeCon(@Param("nextstrain_clade")String nextstrain_clade, @Param("country")String country);

    public List<NCOVSeq> getByVgvNumber(List<String> item);
}
